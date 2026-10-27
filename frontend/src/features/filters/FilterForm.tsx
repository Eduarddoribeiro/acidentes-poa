import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { Period } from '../../shared/api/types'
import { formatHour } from '../../shared/lib/format'
import { Button } from '../../shared/ui/Button'
import styles from './FilterForm.module.css'
import { type Filters, isPeriodValid, ROAD_TYPES, toggle } from './model'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  onClear: () => void
  datasetPeriod?: Period
  defaultPeriod?: Period
  /** Road types present in the dataset; missing ones are not offered. */
  availableRoadTypes?: string[]
  activeCount: number
}

const HOURS = Array.from({ length: 24 }, (_, h) => h)

export function FilterForm({
  filters,
  onChange,
  onClear,
  datasetPeriod,
  defaultPeriod,
  availableRoadTypes,
  activeCount,
}: Props) {
  const { t, i18n } = useTranslation()
  const id = useId()
  const shortWeekdays = t('weekdays.short', { returnObjects: true }) as string[]
  const longWeekdays = t('weekdays.long', { returnObjects: true }) as string[]
  const roadTypes = ROAD_TYPES.filter((type) => !availableRoadTypes || availableRoadTypes.includes(type))
  const start = filters.start ?? defaultPeriod?.start ?? ''
  const end = filters.end ?? defaultPeriod?.end ?? ''
  const hourOptions = HOURS.map((h) => (
    <option key={h} value={h}>
      {formatHour(h, i18n.language)}
    </option>
  ))

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()} aria-label={t('filters.title')}>
      <fieldset className={styles.group}>
        <legend>{t('filters.period')}</legend>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>{t('filters.from')}</span>
            <input
              type="date"
              value={start}
              min={datasetPeriod?.start}
              max={datasetPeriod?.end}
              onChange={(e) => onChange({ ...filters, start: e.target.value || null })}
            />
          </label>
          <label className={styles.field}>
            <span>{t('filters.to')}</span>
            <input
              type="date"
              value={end}
              min={datasetPeriod?.start}
              max={datasetPeriod?.end}
              onChange={(e) => onChange({ ...filters, end: e.target.value || null })}
            />
          </label>
        </div>
        {!isPeriodValid(filters) && (
          <p className={styles.error} role="alert">
            {t('filters.invalidPeriod')}
          </p>
        )}
      </fieldset>

      <fieldset className={styles.group}>
        <legend>{t('filters.time')}</legend>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>{t('filters.hourStart')}</span>
            <select
              aria-describedby={`${id}-hint`}
              value={filters.hourStart ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? null : Number(e.target.value)
                onChange({
                  ...filters,
                  hourStart: value,
                  hourEnd: value === null ? null : (filters.hourEnd ?? (value + 1) % 24),
                })
              }}
            >
              <option value="">{t('filters.anyHour')}</option>
              {hourOptions}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t('filters.hourEnd')}</span>
            <select
              aria-describedby={`${id}-hint`}
              value={filters.hourEnd ?? ''}
              disabled={filters.hourStart === null}
              onChange={(e) => onChange({ ...filters, hourEnd: e.target.value === '' ? null : Number(e.target.value) })}
            >
              <option value="">{t('filters.anyHour')}</option>
              {hourOptions}
            </select>
          </label>
        </div>
        <p className={styles.hint} id={`${id}-hint`}>
          {t('filters.midnightHint')}
        </p>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>{t('filters.weekdays')}</legend>
        <div className={styles.weekdayOptions}>
          {shortWeekdays.map((short, day) => (
            <label key={day} className={styles.option}>
              <input
                type="checkbox"
                aria-label={longWeekdays[day]}
                checked={filters.weekdays.includes(day)}
                onChange={() => onChange({ ...filters, weekdays: toggle(filters.weekdays, day) })}
              />
              <span className={styles.optionLabel} aria-hidden="true">
                {short}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>{t('filters.roadTypes')}</legend>
        <div className={styles.options}>
          {roadTypes.map((type) => (
            <label key={type} className={styles.option}>
              <input
                type="checkbox"
                checked={filters.roadTypes.includes(type)}
                onChange={() => onChange({ ...filters, roadTypes: toggle(filters.roadTypes, type) })}
              />
              <span className={styles.optionLabel}>{t(`roadTypes.${type}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button variant="secondary" onClick={onClear} disabled={activeCount === 0}>
        {t('filters.clear')}
      </Button>
    </form>
  )
}
