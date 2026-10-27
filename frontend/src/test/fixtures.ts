import type { Hotspot, Metadata } from '../shared/api/types'

export const METADATA: Metadata = {
  source: { name: '#DataPoa / EPTC', url: 'https://dadosabertos.poa.br/dataset/acidentes-de-transito-acidentes' },
  load: {
    loaded_at: '2026-10-27T00:04:33',
    extracted_at: '2026-10-01',
    total_read: 87323,
    total_accepted: 80175,
    total_discarded: 7148,
    discards_by_reason: { missing_coordinates: 7144, date_after_extraction: 4 },
    percent_off_map: 8.2,
    percent_missing_coordinates: 8.2,
  },
  dataset_period: { start: '2021-01-01', end: '2026-09-30' },
  default_period: { start: '2021-01-01', end: '2026-09-30' },
  criteria: { radius_meters: 100, min_accidents: 20 },
  road_types: { avenue: 46930, street: 28139, road: 3642, other: 1464 },
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: 'a',
    rank: 1,
    name: 'Av. Presidente Castelo Branco',
    latitude: -30.0245,
    longitude: -51.2195,
    total: 382,
    no_injuries: 278,
    with_injuries: 103,
    with_fatalities: 1,
    first_date: '2021-01-07',
    last_date: '2026-09-23',
    region: 'CENTRO',
  },
  {
    id: 'b',
    rank: 2,
    name: 'Av. Azenha',
    latitude: -30.05,
    longitude: -51.21,
    total: 311,
    no_injuries: 200,
    with_injuries: 108,
    with_fatalities: 3,
    first_date: '2021-02-01',
    last_date: '2026-09-01',
    region: 'SUL',
  },
]
