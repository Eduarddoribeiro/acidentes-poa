import { useCallback, useEffect, useRef, useState } from 'react'

export type AsyncState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T }

interface Options {
  /** While false, nothing is requested and the last state is kept. */
  enabled?: boolean
  /** Wait before requesting, so typing in a field does not fire a request per key. */
  delayMs?: number
}

/**
 * Loads a resource whenever `key` changes. A request still running is aborted when a new one
 * starts or the component unmounts. `reload` tries again with the same key.
 */
export function useAsyncResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  key: string,
  { enabled = true, delayMs = 0 }: Options = {},
) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setState({ status: 'loading' })
    const run = () => {
      loadRef
        .current(controller.signal)
        .then((data) => setState({ status: 'ready', data }))
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            console.error(error)
            setState({ status: 'error' })
          }
        })
    }
    const timer = delayMs > 0 ? window.setTimeout(run, delayMs) : undefined
    if (timer === undefined) run()
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [key, enabled, delayMs, attempt])

  return { state, reload: useCallback(() => setAttempt((n) => n + 1), []) }
}
