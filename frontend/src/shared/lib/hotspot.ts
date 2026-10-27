import type { TFunction } from 'i18next'
import type { Hotspot } from '../api/types'

/** The API sends no name when the dataset has no street for the place. */
export function hotspotName(hotspot: Hotspot, t: TFunction): string {
  return hotspot.name ?? t('hotspot.unnamed')
}
