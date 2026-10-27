/** Contracts of the API (backend/app/api/schemas.py). */

export interface Period {
  start: string
  end: string
}

export interface Metadata {
  source: { name: string; url: string }
  load: {
    loaded_at: string
    extracted_at: string | null
    total_read: number
    total_accepted: number
    total_discarded: number
    discards_by_reason: Record<string, number>
    percent_off_map: number
    percent_missing_coordinates: number
  }
  dataset_period: Period
  default_period: Period
  criteria: { radius_meters: number; min_accidents: number }
  road_types: Record<string, number>
}

export interface Hotspot {
  id: string
  rank: number
  name: string | null
  latitude: number
  longitude: number
  total: number
  no_injuries: number
  with_injuries: number
  with_fatalities: number
  first_date: string
  last_date: string
  region: string | null
}

export interface HotspotList {
  radius_meters: number
  min_accidents: number
  hotspots: Hotspot[]
}

/** Each heatmap point is [latitude, longitude, count]. */
export type HeatPoint = [number, number, number]

export interface Heatmap {
  total: number
  points: HeatPoint[]
}
