import { useTranslation } from 'react-i18next'
import type { Hotspot } from '../../shared/api/types'
import { formatDate, formatNumber } from '../../shared/lib/format'
import { hotspotName } from '../../shared/lib/hotspot'

/** Table version of the hotspots, for screen readers (section 9.1). */
export function HotspotTable({ hotspots }: { hotspots: Hotspot[] }) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  return (
    // The table sits inside a hidden block: tables ignore a 1px width and would widen the page.
    <div className="visually-hidden">
      <table>
        <caption>{t('table.caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('table.rank')}</th>
            <th scope="col">{t('table.place')}</th>
            <th scope="col">{t('table.total')}</th>
            <th scope="col">{t('detail.noInjuries')}</th>
            <th scope="col">{t('detail.withInjuries')}</th>
            <th scope="col">{t('detail.withFatalities')}</th>
            <th scope="col">{t('detail.period')}</th>
          </tr>
        </thead>
        <tbody>
          {hotspots.map((h) => (
            <tr key={h.id}>
              <td>{h.rank}</td>
              <th scope="row">{hotspotName(h, t)}</th>
              <td>{formatNumber(h.total, language)}</td>
              <td>{formatNumber(h.no_injuries, language)}</td>
              <td>{formatNumber(h.with_injuries, language)}</td>
              <td>{formatNumber(h.with_fatalities, language)}</td>
              <td>
                {t('detail.periodValue', {
                  start: formatDate(h.first_date, language),
                  end: formatDate(h.last_date, language),
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
