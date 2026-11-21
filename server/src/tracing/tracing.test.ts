import { createRequire } from 'node:module'
import type { AddressInfo } from 'node:net'
import { SpanKind, trace } from '@opentelemetry/api'
import { BatchSpanProcessor, InMemorySpanExporter } from '@opentelemetry/sdk-trace'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { shutdownTracing } from './shutdown.js'
import { startTracing } from './start.js'

// The stock exporter empties itself when the SDK shuts it down, and this test reads it after.
class SpansKeptAfterShutdown extends InMemorySpanExporter {
  override shutdown(): Promise<void> {
    return Promise.resolve()
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('server tracing', () => {
  it('installs no tracer where OTEL_EXPORTER_OTLP_ENDPOINT is unset', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '')
    await import('./register.js')

    expect(trace.getTracer('probe').startSpan('probe').isRecording()).toBe(false)
  })

  it("skips /api/health, names the API route's span, parents it on the caller's and flushes it on shutdown", async () => {
    // Left at their default, the SDK's OTLP metric and log exporters would send to localhost:4318,
    // and shutdown would retry them past the test's timeout where nothing listens.
    vi.stubEnv('OTEL_METRICS_EXPORTER', 'none')
    vi.stubEnv('OTEL_LOGS_EXPORTER', 'none')
    const exporter = new SpansKeptAfterShutdown()
    // A delay past the test's length leaves the span in the batch until shutdown exports it.
    startTracing({ spanProcessor: new BatchSpanProcessor({ exporter, scheduledDelayMillis: 600_000 }) })
    // Loaded after the SDK starts, as the image's --import orders it, so the instrumentations patch
    // express and node:http. vitest's import of express bypasses the loader hook register.ts
    // installs in the image, so express is required first and app.js imports the patched module.
    createRequire(import.meta.url)('express')
    const { createApp } = await import('../app.js')
    const server = createApp().listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address() as AddressInfo

    const callerTraceId = '4bf92f3577b34da6a3ce929d0e0e4736'
    const callerSpanId = '00f067aa0ba902b7'
    // fetch rather than supertest: node:http's client is instrumented too, and its span would
    // replace the caller's traceparent with its own.
    await (await fetch(`http://127.0.0.1:${port}/api/health`)).text()
    const response = await fetch(`http://127.0.0.1:${port}/api/events/no-such-event`, {
      headers: { traceparent: `00-${callerTraceId}-${callerSpanId}-01`, baggage: 'example.flow.id=flow-42' },
    })
    expect(response.status).toBe(404)
    await response.text()
    await new Promise((resolve) => server.close(resolve))
    expect(exporter.getFinishedSpans()).toHaveLength(0)
    await shutdownTracing()

    // The health request made none, and express's layers make none of their own.
    const spans = exporter.getFinishedSpans()
    expect(spans.map((span) => span.name)).toEqual(['GET /api/events/:id'])
    const [serverSpan] = spans
    expect(serverSpan!.kind).toBe(SpanKind.SERVER)
    expect(serverSpan!.attributes['http.route']).toBe('/api/events/:id')
    expect(serverSpan!.spanContext().traceId).toBe(callerTraceId)
    expect(serverSpan!.parentSpanContext?.spanId).toBe(callerSpanId)
    expect(serverSpan!.attributes['example.flow.id']).toBe('flow-42')
    expect(serverSpan!.resource.attributes['service.name']).toBe('timeline')
  })
})
