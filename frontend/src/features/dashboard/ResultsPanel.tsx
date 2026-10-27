import { type ReactNode, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../../shared/lib/classNames'
import styles from './ResultsPanel.module.css'
import type { SheetHeight, useSheetHeight } from './useSheetHeight'

interface Props {
  isDesktop: boolean
  sheetHeight: SheetHeight
  handleProps: ReturnType<typeof useSheetHeight>['handleProps']
  /** Filters shown at the top of the panel on desktop. On mobile they live in the drawer. */
  filters?: ReactNode
  summary?: ReactNode
  /** Extra control next to the title, such as the filter button on mobile. */
  action?: ReactNode
  busy: boolean
  /** When it changes on desktop, the panel scrolls so the content starts at the top. */
  focusKey?: string
  children: ReactNode
}

/** Bottom sheet with three heights on mobile; fixed 360 px panel on the left on desktop (M10). */
export function ResultsPanel({
  isDesktop,
  sheetHeight,
  handleProps,
  filters,
  summary,
  action,
  busy,
  focusKey,
  children,
}: Props) {
  const { t } = useTranslation()
  const panel = useRef<HTMLElement>(null)
  const header = useRef<HTMLDivElement>(null)

  // On desktop the detail shows at the top of the panel, not below the filters.
  useEffect(() => {
    if (!isDesktop || !focusKey || !panel.current || !header.current) return
    panel.current.scrollTop = header.current.offsetTop
  }, [isDesktop, focusKey])

  return (
    <aside ref={panel} className={cx(styles.panel, styles[sheetHeight])} aria-labelledby="results-title">
      {!isDesktop && (
        <button
          type="button"
          className={styles.handle}
          aria-label={sheetHeight === 'high' ? t('ranking.collapse') : t('ranking.expand')}
          {...handleProps}
        >
          <span aria-hidden="true" />
        </button>
      )}

      {filters && <div className={styles.filters}>{filters}</div>}

      <div ref={header} className={styles.header}>
        <div>
          <h2 id="results-title">{t('ranking.title')}</h2>
          {summary && <p className={styles.summary}>{summary}</p>}
        </div>
        {action}
      </div>

      <div className={styles.content} aria-live="polite" aria-busy={busy}>
        {children}
      </div>
      <p className={styles.disclaimer}>
        {t('disclaimer')} <a href="#/methodology">{t('methodology.howCalculated')}</a>
      </p>
    </aside>
  )
}
