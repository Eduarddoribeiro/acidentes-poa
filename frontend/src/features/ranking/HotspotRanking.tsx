import { useTranslation } from 'react-i18next'
import type { Hotspot } from '../../shared/api/types'
import { cx } from '../../shared/lib/classNames'
import { formatNumber } from '../../shared/lib/format'
import { hotspotName } from '../../shared/lib/hotspot'
import styles from './HotspotRanking.module.css'

interface Props {
  hotspots: Hotspot[]
  selected: Hotspot | null
  onShowOnMap: (hotspot: Hotspot) => void
}

/** Ranking in numbered bands from 1 to N, from the most to the fewest accidents (M6). */
export function HotspotRanking({ hotspots, selected, onShowOnMap }: Props) {
  const { t, i18n } = useTranslation()
  return (
    <ol className={styles.ranking} aria-label={t('ranking.title')}>
      {hotspots.map((hotspot) => {
        const active = hotspot.id === selected?.id
        return (
          <li key={hotspot.id} className={cx(styles.band, active && styles.active)}>
            <button
              type="button"
              className={styles.button}
              data-hotspot-id={hotspot.id}
              aria-current={active ? 'true' : undefined}
              onClick={() => onShowOnMap(hotspot)}
            >
              <span className={styles.rank} aria-hidden="true">
                {hotspot.rank}
              </span>
              <span className={styles.name}>
                {hotspotName(hotspot, t)}
                <span className="visually-hidden">
                  , {t('ranking.accidents', { count: hotspot.total })}. {t('ranking.showOnMap')}
                </span>
              </span>
              <span className={styles.total} aria-hidden="true">
                {formatNumber(hotspot.total, i18n.language)}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
