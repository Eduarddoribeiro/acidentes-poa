import { useTranslation } from 'react-i18next'
import type { Hotspot } from '../../shared/api/types'
import { Button } from '../../shared/ui/Button'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { Notice } from '../../shared/ui/Notice'
import { HotspotDetail } from '../hotspot-detail/HotspotDetail'
import { HotspotRanking } from '../ranking/HotspotRanking'

interface Props {
  status: 'loading' | 'error' | 'ready'
  hotspots: Hotspot[]
  selected: Hotspot | null
  radius: number
  minAccidents: number
  lastDatasetDate: string | null
  onRetry: () => void
  onSelect: (hotspot: Hotspot) => void
  onCloseDetail: () => void
  onClearFilters: () => void
}

/** What the results panel shows: error, loading, the detail of a hotspot, no results or the ranking. */
export function ResultsContent({
  status,
  hotspots,
  selected,
  radius,
  minAccidents,
  lastDatasetDate,
  onRetry,
  onSelect,
  onCloseDetail,
  onClearFilters,
}: Props) {
  const { t } = useTranslation()

  if (status === 'error') return <ErrorState lastDatasetDate={lastDatasetDate} onRetry={onRetry} />
  if (status === 'loading') return <LoadingState />
  if (selected) return <HotspotDetail hotspot={selected} radius={radius} onClose={onCloseDetail} />
  if (hotspots.length === 0) {
    return (
      <Notice title={t('states.emptyTitle')}>
        <p>{t('states.emptyText', { n: minAccidents })}</p>
        <Button onClick={onClearFilters}>{t('filters.clear')}</Button>
      </Notice>
    )
  }
  return <HotspotRanking hotspots={hotspots} selected={selected} onShowOnMap={onSelect} />
}
