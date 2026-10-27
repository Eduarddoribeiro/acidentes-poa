import { useTranslation } from 'react-i18next'
import type { Metadata } from '../../shared/api/types'
import type { AsyncState } from '../../shared/hooks/useAsyncResource'
import { formatDate, formatNumber, formatPercent } from '../../shared/lib/format'
import { ErrorState } from '../../shared/ui/ErrorState'
import { Icon } from '../../shared/ui/Icon'
import { LoadingState } from '../../shared/ui/LoadingState'
import styles from './MethodologyPage.module.css'

interface Props {
  metadata: AsyncState<Metadata>
  onRetry: () => void
}

/** Methodology page (M7): source, period, criteria, discards and usage caveat (RN-06). */
export function MethodologyPage({ metadata, onRetry }: Props) {
  const { t } = useTranslation()

  return (
    <main id="main-content" className={styles.page} tabIndex={-1}>
      <a className={styles.backLink} href="#/">
        <Icon name="back" size={18} />
        {t('methodology.back')}
      </a>
      <h1>{t('methodology.title')}</h1>

      <section aria-labelledby="how-to-read-title" className={styles.howToRead}>
        <h2 id="how-to-read-title">{t('methodology.howToReadTitle')}</h2>
        <p>{t('disclaimer')}</p>
        <p>{t('methodology.trafficVolume')}</p>
      </section>

      {metadata.status === 'loading' && <LoadingState rows={8} />}
      {metadata.status === 'error' && <ErrorState onRetry={onRetry} />}
      {metadata.status === 'ready' && <MethodologySections metadata={metadata.data} />}
    </main>
  )
}

function MethodologySections({ metadata }: { metadata: Metadata }) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { load, criteria } = metadata

  return (
    <>
      <section aria-labelledby="source-title">
        <h2 id="source-title">{t('methodology.sourceTitle')}</h2>
        <p>{t('methodology.sourceText')}</p>
        <p>
          {t('methodology.extraction', {
            date: formatDate(load.extracted_at, language),
            loadedAt: formatDate(load.loaded_at, language),
          })}
        </p>
        <p>
          <a href={metadata.source.url} target="_blank" rel="noreferrer" className={styles.externalLink}>
            {t('methodology.sourceLink')}
            <Icon name="external" size={16} />
          </a>
        </p>
      </section>

      <section aria-labelledby="period-title">
        <h2 id="period-title">{t('methodology.periodTitle')}</h2>
        <p>
          {t('methodology.periodText', {
            start: formatDate(metadata.dataset_period.start, language),
            end: formatDate(metadata.dataset_period.end, language),
            defaultStart: formatDate(metadata.default_period.start, language),
            defaultEnd: formatDate(metadata.default_period.end, language),
          })}
        </p>
        <p>{t('methodology.timeText')}</p>
      </section>

      <section aria-labelledby="criteria-title">
        <h2 id="criteria-title">{t('methodology.criteriaTitle')}</h2>
        <p>{t('methodology.criteriaText', { n: criteria.min_accidents, radius: criteria.radius_meters })}</p>
        <p>{t('methodology.criteriaN', { n: criteria.min_accidents })}</p>
      </section>

      <section aria-labelledby="road-types-title">
        <h2 id="road-types-title">{t('methodology.roadTypesTitle')}</h2>
        <p>{t('methodology.roadTypesText')}</p>
      </section>

      <section aria-labelledby="discards-title">
        <h2 id="discards-title">{t('methodology.discardsTitle')}</h2>
        <p>
          {t('methodology.discardsText', {
            read: formatNumber(load.total_read, language),
            discarded: formatNumber(load.total_discarded, language),
            percent: formatPercent(load.percent_off_map, language),
          })}
        </p>
        <table className={styles.table}>
          <caption className="visually-hidden">{t('methodology.discardsTitle')}</caption>
          <tbody>
            {Object.entries(load.discards_by_reason).map(([reason, count]) => (
              <tr key={reason}>
                <th scope="row">{t(`methodology.reasons.${reason}`, { defaultValue: reason })}</th>
                <td>{formatNumber(count, language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
