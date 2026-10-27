import L from 'leaflet'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleMarker, Marker, useMap, useMapEvents } from 'react-leaflet'
import type { Hotspot } from '../../shared/api/types'
import { cx } from '../../shared/lib/classNames'
import { hotspotName } from '../../shared/lib/hotspot'
import styles from './HotspotMap.module.css'

// The closer the zoom, the more appears: numbered signs for the top places and light dots
// (drawn on canvas) for the rest, only up close.
function visibleAt(zoom: number) {
  if (zoom >= 15) return { signs: 50, dots: true }
  if (zoom >= 13) return { signs: 50, dots: false }
  return { signs: 20, dots: false }
}

// Signs closer than this, in pixels, would overlap.
const SIGN_SPACING = 32

function useZoom(initial: number) {
  const [zoom, setZoom] = useState(initial)
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) })
  return zoom
}

function signIcon(rank: number, active: boolean) {
  return L.divIcon({
    className: '',
    // The sign is 28 px, but the touch area is 44 px.
    html: `<span class="${styles.markerTarget}"><span class="${cx(styles.marker, active && styles.markerActive)}">${rank}</span></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

interface Props {
  hotspots: Hotspot[]
  selected: Hotspot | null
  onSelect: (hotspot: Hotspot) => void
  initialZoom: number
}

export function HotspotMarkers({ hotspots, selected, onSelect, initialZoom }: Props) {
  const { t } = useTranslation()
  const map = useMap()
  const zoom = useZoom(initialZoom)
  const { signs, dots } = visibleAt(zoom)
  const icons = useMemo(
    () => new Map(hotspots.map((h) => [h.id, signIcon(h.rank, h.id === selected?.id)])),
    [hotspots, selected],
  )
  // Signs never overlap: in ranking order, a sign that would touch one already placed waits
  // until the zoom opens room for it. The selected hotspot always shows.
  const withSign = useMemo(() => {
    const placed: L.Point[] = []
    const ids = new Set<string>()
    const candidates = hotspots.filter((h) => h.rank <= signs || h.id === selected?.id)
    const order = [...candidates].sort((a, b) =>
      a.id === selected?.id ? -1 : b.id === selected?.id ? 1 : a.rank - b.rank,
    )
    for (const hotspot of order) {
      const xy = map.project([hotspot.latitude, hotspot.longitude], zoom)
      const overlaps = placed.some((p) => Math.abs(p.x - xy.x) < SIGN_SPACING && Math.abs(p.y - xy.y) < SIGN_SPACING)
      if (hotspot.id !== selected?.id && overlaps) continue
      placed.push(xy)
      ids.add(hotspot.id)
    }
    return ids
  }, [hotspots, signs, selected, map, zoom])

  return (
    <>
      {dots &&
        hotspots
          .filter((h) => h.rank > signs && h.id !== selected?.id)
          .map((hotspot) => (
            <CircleMarker
              key={hotspot.id}
              center={[hotspot.latitude, hotspot.longitude]}
              radius={5}
              pathOptions={{ color: '#EEF0EC', weight: 1.5, fillColor: '#1B2A33', fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelect(hotspot) }}
            />
          ))}
      {hotspots
        .filter((h) => withSign.has(h.id))
        .map((hotspot) => {
          const label = t('map.hotspotLabel', { rank: hotspot.rank, name: hotspotName(hotspot, t), total: hotspot.total })
          return (
            <Marker
              key={hotspot.id}
              position={[hotspot.latitude, hotspot.longitude]}
              icon={icons.get(hotspot.id)}
              title={label}
              alt={label}
              keyboard
              zIndexOffset={hotspot.id === selected?.id ? 1000 : -hotspot.rank}
              eventHandlers={{ click: () => onSelect(hotspot) }}
            />
          )
        })}
    </>
  )
}
