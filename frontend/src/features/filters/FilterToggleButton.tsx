import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../shared/ui/Button'
import { Icon } from '../../shared/ui/Icon'
import styles from './FilterToggleButton.module.css'

/** Opens the filter drawer on mobile and shows how many filters are active. */
export const FilterToggleButton = forwardRef<HTMLButtonElement, { activeCount: number; onClick: () => void }>(
  function FilterToggleButton({ activeCount, onClick }, ref) {
    const { t } = useTranslation()
    return (
      <Button
        ref={ref}
        className={styles.toggle}
        onClick={onClick}
        aria-haspopup="dialog"
        aria-label={activeCount ? t('filters.openWithCount', { count: activeCount }) : t('filters.open')}
      >
        <Icon name="filter" />
        {t('filters.open')}
        {activeCount > 0 && (
          <span className={styles.counter} aria-hidden="true">
            {activeCount}
          </span>
        )}
      </Button>
    )
  },
)
