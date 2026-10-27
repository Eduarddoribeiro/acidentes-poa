import { type PointerEvent, useCallback, useRef, useState } from 'react'

/** The three heights of the ranking sheet on mobile (section 9.1). */
export const SHEET_HEIGHTS = ['low', 'medium', 'high'] as const
export type SheetHeight = (typeof SHEET_HEIGHTS)[number]

// Shorter drags count as a tap.
const MIN_DRAG_PX = 24

export function useSheetHeight() {
  const [height, setHeight] = useState<SheetHeight>('low')
  const dragStart = useRef<number | null>(null)

  const step = (direction: 1 | -1) =>
    setHeight((current) => {
      const next = Math.min(Math.max(SHEET_HEIGHTS.indexOf(current) + direction, 0), SHEET_HEIGHTS.length - 1)
      return SHEET_HEIGHTS[next]
    })

  /** Opening a hotspot lifts the sheet from its lowest height, so the detail is visible. */
  const raise = useCallback(() => setHeight((current) => (current === 'low' ? 'medium' : current)), [])

  // Tapping the handle cycles through the heights; dragging it up or down moves one step.
  const handleProps = {
    onClick: () => setHeight((current) => SHEET_HEIGHTS[(SHEET_HEIGHTS.indexOf(current) + 1) % SHEET_HEIGHTS.length]),
    onPointerDown: (e: PointerEvent) => {
      dragStart.current = e.clientY
    },
    onPointerUp: (e: PointerEvent) => {
      if (dragStart.current === null) return
      const delta = e.clientY - dragStart.current
      dragStart.current = null
      if (Math.abs(delta) >= MIN_DRAG_PX) step(delta < 0 ? 1 : -1)
    },
  }

  return { height, raise, handleProps }
}
