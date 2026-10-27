import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import type { HeatPoint, Hotspot } from '../../shared/api/types'
import { FlyToHotspot } from './FlyToHotspot'
import { HeatLayer } from './HeatLayer'
import styles from './HotspotMap.module.css'
import { HotspotMarkers } from './HotspotMarkers'
import './leaflet-theme.css'

const CITY_CENTER: [number, number] = [-30.05, -51.19]
const CITY_BOUNDS = L.latLngBounds([-30.28, -51.32], [-29.93, -51.0])
const INITIAL_ZOOM = 12

interface Props {
  hotspots: Hotspot[]
  heatPoints: HeatPoint[]
  selected: Hotspot | null
  onSelect: (hotspot: Hotspot) => void
  /** Pixels the map center moves down when flying to a hotspot (area covered by the sheet on mobile). */
  offsetY?: number
}

/** Heatmap with the numbered hotspots (M4). Loaded lazily: Leaflet is the heaviest part of the page. */
export function HotspotMap({ hotspots, heatPoints, selected, onSelect, offsetY = 0 }: Props) {
  const { t } = useTranslation()

  return (
    <MapContainer
      center={CITY_CENTER}
      zoom={INITIAL_ZOOM}
      minZoom={11}
      maxBounds={CITY_BOUNDS.pad(0.3)}
      className={styles.map}
      preferCanvas
      zoomControl={false}
      attributionControl
      aria-label={t('map.label')}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      <ZoomControl position="topright" />
      <HeatLayer points={heatPoints} />
      <HotspotMarkers hotspots={hotspots} selected={selected} onSelect={onSelect} initialZoom={INITIAL_ZOOM} />
      <FlyToHotspot hotspot={selected} offsetY={offsetY} />
    </MapContainer>
  )
}
