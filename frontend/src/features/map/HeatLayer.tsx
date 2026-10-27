import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { HeatPoint } from '../../shared/api/types'
import { HEAT_GRADIENT } from './heatScale'

// leaflet.heat registers itself on the global L, so L is exposed before the plugin loads.
;(window as unknown as { L: typeof L }).L = L
const plugin = import('leaflet.heat')

type HeatLayerFactory = (points: HeatPoint[], options: object) => L.Layer

export function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap()
  useEffect(() => {
    let layer: L.Layer | undefined
    let cancelled = false
    plugin.then(() => {
      if (cancelled) return
      const max = Math.max(1, ...points.map((p) => p[2]))
      layer = (L as unknown as { heatLayer: HeatLayerFactory }).heatLayer(points, {
        radius: 14,
        blur: 16,
        minOpacity: 0.25,
        max: Math.min(max, 6),
        gradient: HEAT_GRADIENT,
      })
      layer.addTo(map)
    })
    return () => {
      cancelled = true
      layer?.remove()
    }
  }, [points, map])
  return null
}
