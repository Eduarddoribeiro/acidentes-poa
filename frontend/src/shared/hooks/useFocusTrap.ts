import { type RefObject, useEffect } from 'react'

const FOCUSABLE = 'input, select, button:not([disabled]), a[href]'

/** Keeps focus inside a dialog while it is open, focuses its first field and closes it on Escape. */
export function useFocusTrap(container: RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    container.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !container.current) return
      const focusable = container.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [container, onClose])
}
