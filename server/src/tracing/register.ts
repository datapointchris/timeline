// Loaded with `node --import` ahead of the server. The HTTP instrumentation patches node:http only
// when it loads before the server's modules, and the ESM loader hook is how it reaches them.
// Where OTEL_EXPORTER_OTLP_ENDPOINT is unset this loads nothing, so the server runs untraced.
import { register } from 'node:module'

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  register('@opentelemetry/instrumentation/hook.mjs', import.meta.url)
  const { startTracing } = await import('./start.js')
  startTracing()
}
