import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Hotspot, Metadata } from '../../shared/api/types'
import { lastDatasetDate } from '../../shared/api/useMetadata'
import type { AsyncState } from '../../shared/hooks/useAsyncResource'
import { DESKTOP_QUERY, useMediaQuery } from '../../shared/hooks/useMediaQuery'
import { FilterDrawer } from '../filters/FilterDrawer'
import { FilterForm } from '../filters/FilterForm'
import { FilterToggleButton } from '../filters/FilterToggleButton'
import { countActiveFilters, emptyFilters, type Filters } from '../filters/model'
import { MapLegend } from '../map/MapLegend'
import { HotspotTable } from '../ranking/HotspotTable'
import styles from './DashboardPage.module.css'
import { ResultsContent } from './ResultsContent'
import { ResultsPanel } from './ResultsPanel'
import { useHotspotSelection } from './useHotspotSelection'
import { useMapData } from './useMapData'
import { useSheetHeight } from './useSheetHeight'

const HotspotMap = lazy(() => import('../map/HotspotMap').then((m) => ({ default: m.HotspotMap })))

// Share of the screen the sheet covers on mobile; the map centers the hotspot above it.
const SHEET_OFFSET = 0.26

interface Props {
  metadata: AsyncState<Metadata>
  onRetryMetadata: () => void
}

/** Main dashboard (flow 3.1): map, filters, ranking and detail. */
export function DashboardPage({ metadata, onRetryMetadata }: Props) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const filterButton = useRef<HTMLButtonElement>(null)
  const sheet = useSheetHeight()

  const meta = metadata.status === 'ready' ? metadata.data : undefined
  const mapData = useMapData(filters, metadata.status === 'ready')
  const data = mapData.state.status === 'ready' ? mapData.state.data : undefined
  const hotspots = data?.hotspots.hotspots ?? []
  const selection = useHotspotSelection(hotspots, data !== undefined)
  const activeCount = countActiveFilters(filters, meta?.default_period)
  const radius = meta?.criteria.radius_meters ?? 100
  const minAccidents = meta?.criteria.min_accidents ?? 0

  const clearFilters = useCallback(() => setFilters(emptyFilters()), [])
  const { select } = selection
  const { raise } = sheet
  const selectHotspot = useCallback(
    (hotspot: Hotspot) => {
      select(hotspot)
      if (!isDesktop) raise()
    },
    [select, raise, isDesktop],
  )
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    filterButton.current?.focus()
  }, [])

  const status =
    metadata.status === 'error' || mapData.state.status === 'error'
      ? 'error'
      : metadata.status === 'loading' || mapData.state.status === 'loading'
        ? 'loading'
        : 'ready'

  const filterForm = (
    <FilterForm
      filters={filters}
      onChange={setFilters}
      onClear={clearFilters}
      datasetPeriod={meta?.dataset_period}
      defaultPeriod={meta?.default_period}
      availableRoadTypes={meta ? Object.keys(meta.road_types) : undefined}
      activeCount={activeCount}
    />
  )

  return (
    <main id="main-content" className={styles.dashboard} tabIndex={-1}>
      <div className={styles.mapArea}>
        <Suspense fallback={<div className={styles.mapFallback} />}>
          <HotspotMap
            hotspots={hotspots}
            heatPoints={data?.heatmap.points ?? []}
            selected={selection.selected}
            onSelect={selectHotspot}
            offsetY={isDesktop ? 0 : Math.round(window.innerHeight * SHEET_OFFSET)}
          />
        </Suspense>
        <MapLegend />
      </div>

      <ResultsPanel
        isDesktop={isDesktop}
        sheetHeight={sheet.height}
        handleProps={sheet.handleProps}
        filters={isDesktop ? filterForm : undefined}
        summary={
          data && (
            <>
              {t('ranking.summary', { count: hotspots.length, n: minAccidents, radius })}
              <br />
              {t('ranking.totalInSlice', { count: data.heatmap.total })}
            </>
          )
        }
        action={
          !isDesktop && (
            <FilterToggleButton ref={filterButton} activeCount={activeCount} onClick={() => setDrawerOpen(true)} />
          )
        }
        busy={status === 'loading'}
        focusKey={selection.selected?.id}
      >
        <ResultsContent
          status={status}
          hotspots={hotspots}
          selected={selection.selected}
          radius={radius}
          minAccidents={minAccidents}
          lastDatasetDate={meta?.load.extracted_at ?? lastDatasetDate()}
          onRetry={metadata.status === 'error' ? onRetryMetadata : mapData.reload}
          onSelect={selectHotspot}
          onCloseDetail={selection.close}
          onClearFilters={clearFilters}
        />
      </ResultsPanel>

      {data && <HotspotTable hotspots={hotspots} />}

      {!isDesktop && drawerOpen && <FilterDrawer onClose={closeDrawer}>{filterForm}</FilterDrawer>}
    </main>
  )
}
