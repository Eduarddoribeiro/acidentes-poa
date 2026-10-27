import { type ReactNode, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusTrap } from '../../shared/hooks/useFocusTrap'
import { Button, IconButton } from '../../shared/ui/Button'
import styles from './FilterDrawer.module.css'

/** Bottom drawer with the filters, on mobile. */
export function FilterDrawer({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDivElement>(null)
  useFocusTrap(dialog, onClose)

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
        <div className={styles.header}>
          <h2 id="filter-drawer-title">{t('filters.title')}</h2>
          <IconButton icon="close" label={t('filters.close')} onClick={onClose} />
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <Button onClick={onClose}>{t('filters.showResults')}</Button>
        </div>
      </div>
    </div>
  )
}
