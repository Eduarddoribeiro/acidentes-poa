import type { Period } from '../../shared/api/types'

/** Dashboard filters. They combine with AND (RN-04). */
export interface Filters {
  start: string | null
  end: string | null
  /** Start hour, inclusive, from 0 to 23. */
  hourStart: number | null
  /** End hour, exclusive, from 1 to 24. Lower than the start when the range crosses midnight. */
  hourEnd: number | null
  /** 0 = Monday, 6 = Sunday. */
  weekdays: number[]
  roadTypes: string[]
}

export const ROAD_TYPES = ['avenue', 'street', 'road', 'highway', 'other'] as const

export function emptyFilters(): Filters {
  return { start: null, end: null, hourStart: null, hourEnd: null, weekdays: [], roadTypes: [] }
}

export function isTimeRangeActive(filters: Filters): boolean {
  return filters.hourStart !== null && filters.hourEnd !== null && filters.hourStart !== filters.hourEnd % 24
}

export function isPeriodValid(filters: Filters): boolean {
  return !filters.start || !filters.end || filters.start <= filters.end
}

/** Period and time of day count as one filter each; weekdays and road types too. */
export function countActiveFilters(filters: Filters, defaultPeriod?: Period): number {
  const periodChanged =
    (filters.start !== null && filters.start !== defaultPeriod?.start) ||
    (filters.end !== null && filters.end !== defaultPeriod?.end)
  return [periodChanged, isTimeRangeActive(filters), filters.weekdays.length > 0, filters.roadTypes.length > 0].filter(
    Boolean,
  ).length
}

/** Query string for the API. Lists are sorted so the same slice always yields the same query. */
export function toQueryString(filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.start) params.set('start', filters.start)
  if (filters.end) params.set('end', filters.end)
  if (isTimeRangeActive(filters)) {
    params.set('hour_start', String(filters.hourStart))
    params.set('hour_end', String(filters.hourEnd))
  }
  if (filters.weekdays.length) params.set('weekdays', [...filters.weekdays].sort().join(','))
  if (filters.roadTypes.length) params.set('road_types', [...filters.roadTypes].sort().join(','))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}
