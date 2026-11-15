import { onScopeDispose } from 'vue'

/**
 * Runs the most recently scheduled callback once `ms` have passed with no newer schedule.
 * The pending callback is cancelled when the owning component or effect scope is disposed,
 * so a search typed just before a panel closes does not fire against an unmounted view.
 */
export function useDebounce(ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function schedule(fn: () => void) {
    cancel()
    timer = setTimeout(() => {
      timer = null
      fn()
    }, ms)
  }

  onScopeDispose(cancel)

  return { schedule, cancel }
}
