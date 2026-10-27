import { useCallback, useEffect, useState } from 'react'
import type { Hotspot } from '../../shared/api/types'

/**
 * Selected hotspot. It is cleared when the filters change and it leaves the slice, and closing
 * the detail returns focus to the ranking band that opened it.
 */
export function useHotspotSelection(hotspots: Hotspot[], ready: boolean) {
  const [selected, setSelected] = useState<Hotspot | null>(null)
  const [returnFocusTo, setReturnFocusTo] = useState<string | null>(null)

  useEffect(() => {
    if (selected && ready && !hotspots.some((h) => h.id === selected.id)) setSelected(null)
  }, [hotspots, selected, ready])

  useEffect(() => {
    if (selected || !returnFocusTo) return
    document.querySelector<HTMLElement>(`[data-hotspot-id="${CSS.escape(returnFocusTo)}"]`)?.focus()
    setReturnFocusTo(null)
  }, [selected, returnFocusTo])

  const close = useCallback(() => {
    setReturnFocusTo(selected?.id ?? null)
    setSelected(null)
  }, [selected])

  return { selected, select: setSelected, close }
}
