import type { AddressInfo } from 'node:net'
import { SpanKind, trace } from '@opentelemetry/api'
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startTracing } from './start.js'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('server tracing', () => {
  it('installs no tracer where OTEL_EXPORTER_OTLP_ENDPOINT is unset', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '')
    await import('./register.js')

    expect(trace.getTracer('probe').startSpan('probe').isRecording()).toBe(false)
  })

  it("makes the server span a child of the caller's and copies its baggage", async () => {
    const exporter = new InMemorySpanExporter()
    const processor = new SimpleSpanProcessor({ exporter })
    const sdk = startTracing({ spanProcessor: processor })
    // Imported after the SDK starts, as the image's --import orders it, so express loads node:http
    // through the instrumentation's hook.
    const { createApp } = await import('../app.js')
    const server = createApp().listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address() as AddressInfo

    const callerTraceId = '4bf92f3577b34da6a3ce929d0e0e4736'
    const callerSpanId = '00f067aa0ba902b7'
    // fetch rather than supertest: node:http's client is instrumented too, and its span would
    // replace the caller's traceparent with its own.
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: { traceparent: `00-${callerTraceId}-${callerSpanId}-01`, baggage: 'example.flow.id=flow-42' },
    })
    await response.text()
    await new Promise((resolve) => server.close(resolve))
    await processor.forceFlush()

    const serverSpans = exporter.getFinishedSpans().filter((span) => span.kind === SpanKind.SERVER)
    expect(serverSpans).toHaveLength(1)
    const [serverSpan] = serverSpans
    expect(serverSpan!.spanContext().traceId).toBe(callerTraceId)
    expect(serverSpan!.parentSpanContext?.spanId).toBe(callerSpanId)
    expect(serverSpan!.attributes['example.flow.id']).toBe('flow-42')
    expect(serverSpan!.resource.attributes['service.name']).toBe('timeline')
    await sdk.shutdown()
  })
})
