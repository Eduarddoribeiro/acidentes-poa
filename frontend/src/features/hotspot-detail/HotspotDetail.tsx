import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Hotspot } from '../../shared/api/types'
import { cx } from '../../shared/lib/classNames'
import { formatDate, formatNumber } from '../../shared/lib/format'
import { hotspotName } from '../../shared/lib/hotspot'
import { IconButton } from '../../shared/ui/Button'
import styles from './HotspotDetail.module.css'

interface Props {
  hotspot: Hotspot
  radius: number
  onClose: () => void
}

/** Detail of a hotspot: count, composition by severity and period (flow 3.1, step 4). */
export function HotspotDetail({ hotspot, radius, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const title = useRef<HTMLHeadingElement>(null)
  const language = i18n.language

  useEffect(() => {
    // No scrolling: the results panel takes care of showing the detail in the right place.
    title.current?.focus({ preventScroll: true })
  }, [hotspot.id])

  const composition = [
    { key: 'noInjuries', value: hotspot.no_injuries, swatch: styles.noInjuries },
    { key: 'withInjuries', value: hotspot.with_injuries, swatch: styles.withInjuries },
    { key: 'withFatalities', value: hotspot.with_fatalities, swatch: styles.withFatalities },
  ] as const

  return (
    <section className={styles.detail} aria-labelledby="hotspot-detail-title">
      <div className={styles.top}>
        <span className={styles.rank} aria-hidden="true">
          {hotspot.rank}
        </span>
        <h2 id="hotspot-detail-title" ref={title} tabIndex={-1}>
          <span className="visually-hidden">{t('ranking.rank', { rank: hotspot.rank })} </span>
          {hotspotName(hotspot, t)}
        </h2>
        <IconButton icon="close" label={t('detail.close')} onClick={onClose} />
      </div>

      <p className={styles.total}>
        <span className={styles.number}>{formatNumber(hotspot.total, language)}</span>
        <span>{t('detail.total', { radius })}</span>
      </p>

      <h3 className={styles.subtitle}>{t('detail.composition')}</h3>
      <div className={styles.bar} aria-hidden="true">
        {composition.map(
          ({ key, value, swatch }) => value > 0 && <span key={key} className={swatch} style={{ flexGrow: value }} />,
        )}
      </div>
      <dl className={styles.list}>
        {composition.map(({ key, value, swatch }) => (
          <div key={key}>
            <dt>
              <span className={cx(styles.swatch, swatch)} aria-hidden="true" />
              {t(`detail.${key}`)}
            </dt>
            <dd>{formatNumber(value, language)}</dd>
          </div>
        ))}
      </dl>

      <dl className={cx(styles.list, styles.facts)}>
        <div>
          <dt>{t('detail.period')}</dt>
          <dd>
            {t('detail.periodValue', {
              start: formatDate(hotspot.first_date, language),
              end: formatDate(hotspot.last_date, language),
            })}
          </dd>
        </div>
        {hotspot.region && (
          <div>
            <dt>{t('detail.region')}</dt>
            <dd>{hotspot.region.charAt(0) + hotspot.region.slice(1).toLowerCase()}</dd>
          </div>
        )}
      </dl>
      <p className={styles.disclaimer}>{t('detail.disclaimer')}</p>
    </section>
  )
}
