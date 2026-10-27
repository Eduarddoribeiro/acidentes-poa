import { useTranslation } from 'react-i18next'
import { formatDate } from '../lib/format'
import { Button } from './Button'
import { Notice } from './Notice'

interface Props {
  /** Extraction date of the last dataset that loaded, when known. */
  lastDatasetDate?: string | null
  onRetry: () => void
}

/** Load error: says what happened, when the data was last updated and how to try again. */
export function ErrorState({ lastDatasetDate, onRetry }: Props) {
  const { t, i18n } = useTranslation()
  return (
    <Notice title={t('states.errorTitle')} tone="error">
      <p>{t('states.errorText')}</p>
      {lastDatasetDate && <p>{t('states.lastUpdate', { date: formatDate(lastDatasetDate, i18n.language) })}</p>}
      <Button onClick={onRetry}>{t('states.retry')}</Button>
    </Notice>
  )
}
