// The server's shutdown flushes spans through here, so it never loads the SDK where tracing is off.
let stopTracing: (() => Promise<void>) | undefined

export function setTracingShutdown(stop: () => Promise<void>): void {
  stopTracing = stop
}

/** Exports the spans still batched and stops the SDK, or does nothing where tracing never started. */
export async function shutdownTracing(): Promise<void> {
  await stopTracing?.()
}
