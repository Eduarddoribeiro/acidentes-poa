import { useTranslation } from 'react-i18next'
import { HEAT_COLORS } from './heatScale'
import styles from './MapLegend.module.css'

/** Heatmap legend. Lives outside the lazy map chunk so it shows while the map loads. */
export function MapLegend() {
  const { t } = useTranslation()
  return (
    <div className={styles.legend} aria-hidden="true">
      <span>{t('map.legend')}</span>
      <span className={styles.scale} style={{ background: `linear-gradient(to right, ${HEAT_COLORS.join(', ')})` }} />
      <span className={styles.ends}>
        <span>{t('map.less')}</span>
        <span>{t('map.more')}</span>
      </span>
    </div>
  )
}
