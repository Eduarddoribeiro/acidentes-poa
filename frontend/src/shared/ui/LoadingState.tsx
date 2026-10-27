import { useTranslation } from 'react-i18next'
import styles from './LoadingState.module.css'

/** Soft-contrast blocks in place of the content while it loads (section 9.1). */
export function LoadingState({ rows = 6 }: { rows?: number }) {
  const { t } = useTranslation()
  return (
    <div className={styles.loading} role="status">
      <span className="visually-hidden">{t('states.loading')}</span>
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className={styles.block} aria-hidden="true" />
      ))}
    </div>
  )
}
