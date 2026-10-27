import { api } from '../../shared/api/client'
import type { Heatmap, HotspotList } from '../../shared/api/types'
import { useAsyncResource } from '../../shared/hooks/useAsyncResource'
import { type Filters, isPeriodValid, toQueryString } from '../filters/model'

export interface MapData {
  hotspots: HotspotList
  heatmap: Heatmap
}

/** Hotspots and heatmap of the slice. An invalid period keeps the last result on screen. */
export function useMapData(filters: Filters, enabled: boolean) {
  const query = toQueryString(filters)
  return useAsyncResource<MapData>(
    (signal) =>
      Promise.all([api.hotspots(query, signal), api.heatmap(query, signal)]).then(([hotspots, heatmap]) => ({
        hotspots,
        heatmap,
      })),
    query,
    // A short wait so typing in the date fields does not fire a request per key.
    { enabled: enabled && isPeriodValid(filters), delayMs: 250 },
  )
}
