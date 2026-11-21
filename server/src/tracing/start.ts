import { ALLOW_ALL_BAGGAGE_KEYS, BaggageSpanProcessor } from '@opentelemetry/baggage-span-processor'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor, type SpanProcessor } from '@opentelemetry/sdk-trace'

/**
 * Starts the OpenTelemetry Node SDK with the HTTP instrumentation, and returns it.
 *
 * The standard `OTEL_*` variables configure the rest. The default W3C trace-context and baggage
 * propagators make a request's server span a child of the caller named in its `traceparent`, and
 * every member of its `baggage` header is copied onto each span as an attribute.
 *
 * `spanProcessor` replaces the batch processor that exports over OTLP/HTTP.
 */
export function startTracing({ spanProcessor }: { spanProcessor?: SpanProcessor } = {}): NodeSDK {
  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'timeline',
    instrumentations: [new HttpInstrumentation()],
    // Naming processors here stops the SDK building its own from OTEL_TRACES_EXPORTER, so the
    // exporting one sits beside the baggage copy.
    spanProcessors: [
      new BaggageSpanProcessor(ALLOW_ALL_BAGGAGE_KEYS),
      spanProcessor ?? new BatchSpanProcessor({ exporter: new OTLPTraceExporter() }),
    ],
  })
  sdk.start()
  return sdk
}
