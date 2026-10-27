import type { Heatmap, HotspotList, Metadata } from './types'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal })
  if (!response.ok) throw new ApiError(`Request to ${path} failed`, response.status)
  return (await response.json()) as T
}

/** `query` is a ready query string, such as '?weekdays=5', or ''. */
export const api = {
  metadata: (signal?: AbortSignal) => getJson<Metadata>('/api/metadata', signal),
  hotspots: (query: string, signal?: AbortSignal) => getJson<HotspotList>(`/api/hotspots${query}`, signal),
  heatmap: (query: string, signal?: AbortSignal) => getJson<Heatmap>(`/api/heatmap${query}`, signal),
}
