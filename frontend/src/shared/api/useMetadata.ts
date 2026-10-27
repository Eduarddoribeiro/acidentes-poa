import { useEffect } from 'react'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { readStorage, writeStorage } from '../lib/storage'
import { api } from './client'

const LAST_DATASET_DATE_KEY = 'acidentes-poa:last-dataset-date'

/** Extraction date of the last dataset that loaded, for the error message when the API does not answer. */
export function lastDatasetDate(): string | null {
  return readStorage(LAST_DATASET_DATE_KEY)
}

export function useMetadata() {
  const metadata = useAsyncResource(api.metadata, 'metadata')
  const extractedAt = metadata.state.status === 'ready' ? metadata.state.data.load.extracted_at : null

  useEffect(() => {
    if (extractedAt) writeStorage(LAST_DATASET_DATE_KEY, extractedAt)
  }, [extractedAt])

  return metadata
}
