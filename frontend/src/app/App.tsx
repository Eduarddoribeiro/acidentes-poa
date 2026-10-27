import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { MethodologyPage } from '../features/methodology/MethodologyPage'
import { useMetadata } from '../shared/api/useMetadata'
import { cx } from '../shared/lib/classNames'
import styles from './App.module.css'
import { AppHeader } from './AppHeader'
import { useHashRoute } from './useHashRoute'

export default function App() {
  const { t } = useTranslation()
  const route = useHashRoute()
  // Metadata feeds both pages, so it is loaded once here.
  const metadata = useMetadata()

  useEffect(() => {
    document.title = route === 'methodology' ? `${t('methodology.title')} · ${t('app.title')}` : t('app.title')
  }, [route, t])

  return (
    <div className={cx(route === 'methodology' && styles.methodology)}>
      <a
        className={styles.skipLink}
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        {t('app.skipToContent')}
      </a>
      <AppHeader route={route} />

      {route === 'methodology' ? (
        <MethodologyPage metadata={metadata.state} onRetry={metadata.reload} />
      ) : (
        <DashboardPage metadata={metadata.state} onRetryMetadata={metadata.reload} />
      )}
    </div>
  )
}
