import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { Hotspot } from '../../shared/api/types'

interface Props {
  hotspot: Hotspot | null
  /** Pixels the target moves up, so it is not hidden behind the ranking sheet on mobile. */
  offsetY: number
}

/** Brings the map to the selected hotspot. */
export function FlyToHotspot({ hotspot, offsetY }: Props) {
  const map = useMap()
  useEffect(() => {
    if (!hotspot) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const zoom = Math.max(map.getZoom(), 16)
    const target = map.unproject(map.project([hotspot.latitude, hotspot.longitude], zoom).add([0, offsetY]), zoom)
    if (reduceMotion) map.setView(target, zoom)
    else map.flyTo(target, zoom, { duration: 0.6 })
  }, [hotspot, map, offsetY])
  return null
}
