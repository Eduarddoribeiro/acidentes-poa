import { describe, expect, it } from 'vitest'
import { countActiveFilters, emptyFilters, isPeriodValid, isTimeRangeActive, toggle, toQueryString } from './model'

describe('filters model', () => {
  it('no filters means no parameters and no active filters', () => {
    expect(toQueryString(emptyFilters())).toBe('')
    expect(countActiveFilters(emptyFilters())).toBe(0)
  })

  it('combines a time range across midnight with a weekday (RN-04)', () => {
    const filters = { ...emptyFilters(), hourStart: 22, hourEnd: 2, weekdays: [5] }

    expect(toQueryString(filters)).toBe('?hour_start=22&hour_end=2&weekdays=5')
    expect(countActiveFilters(filters)).toBe(2)
  })

  it('a period equal to the default one is not an active filter', () => {
    const defaultPeriod = { start: '2021-01-01', end: '2026-09-30' }

    expect(countActiveFilters({ ...emptyFilters(), ...defaultPeriod }, defaultPeriod)).toBe(0)
    expect(countActiveFilters({ ...emptyFilters(), start: '2024-01-01' }, defaultPeriod)).toBe(1)
  })

  it('a time range that starts where it ends is the whole day', () => {
    expect(isTimeRangeActive({ ...emptyFilters(), hourStart: 0, hourEnd: 24 })).toBe(false)
    expect(isTimeRangeActive({ ...emptyFilters(), hourStart: 8, hourEnd: 8 })).toBe(false)
  })

  it('sorts weekdays and road types so the same slice yields the same query', () => {
    expect(toQueryString({ ...emptyFilters(), weekdays: [6, 0], roadTypes: ['street', 'avenue'] })).toBe(
      '?weekdays=0%2C6&road_types=avenue%2Cstreet',
    )
  })

  it('rejects an inverted period', () => {
    expect(isPeriodValid({ ...emptyFilters(), start: '2025-01-01', end: '2024-01-01' })).toBe(false)
  })

  it('toggle adds and removes', () => {
    expect(toggle([1, 2], 2)).toEqual([1])
    expect(toggle([1], 3)).toEqual([1, 3])
  })
})
