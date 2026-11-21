import { ALLOW_ALL_BAGGAGE_KEYS, BaggageSpanProcessor } from '@opentelemetry/baggage-span-processor'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { ExpressInstrumentation, ExpressLayerType } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor, type SpanProcessor } from '@opentelemetry/sdk-trace'
import { setTracingShutdown } from './shutdown.js'

// The container's healthcheck calls /api/health every 30 seconds, and its spans name no caller and
// no work.
const untracedPaths = new Set(['/api/health'])

/**
 * Starts the OpenTelemetry Node SDK with the HTTP and Express instrumentations, and returns it.
 *
 * The standard `OTEL_*` variables configure the rest. The default W3C trace-context and baggage
 * propagators make a request's server span a child of the caller named in its `traceparent`, and
 * every member of its `baggage` header is copied onto each span as an attribute. Each server span
 * is named by its method and the Express route that answered it, such as `GET /api/events/:id`.
 * `shutdownTracing()` from `./shutdown.js` then shuts this SDK down.
 *
 * `spanProcessor` replaces the batch processor that exports over OTLP/HTTP.
 */
export function startTracing({ spanProcessor }: { spanProcessor?: SpanProcessor } = {}): NodeSDK {
  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'timeline',
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => untracedPaths.has(request.url?.split('?', 1)[0] ?? ''),
      }),
      // Only for the route it hands the HTTP server span: it sets that route before it checks
      // whether a layer is ignored, so ignoring every layer type adds no spans of its own.
      new ExpressInstrumentation({
        ignoreLayersType: [ExpressLayerType.MIDDLEWARE, ExpressLayerType.ROUTER, ExpressLayerType.REQUEST_HANDLER],
      }),
    ],
    // Naming processors here stops the SDK building its own from OTEL_TRACES_EXPORTER, so the
    // exporting one sits beside the baggage copy.
    spanProcessors: [
      new BaggageSpanProcessor(ALLOW_ALL_BAGGAGE_KEYS),
      spanProcessor ?? new BatchSpanProcessor({ exporter: new OTLPTraceExporter() }),
    ],
  })
  sdk.start()
  setTracingShutdown(() => sdk.shutdown())
  return sdk
}
