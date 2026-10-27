/** Dates and numbers formatted for the current language (M12). */

export function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language).format(value)
}

export function formatPercent(value: number, language: string): string {
  return new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 1 }).format(value / 100)
}

/** Takes 'YYYY-MM-DD' (or ISO with time) and shows the date in the language's format, without time zone. */
export function formatDate(iso: string | null | undefined, language: string): string {
  if (!iso) return '—'
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat(language, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  )
}

export function formatHour(hour: number, language: string): string {
  return new Intl.DateTimeFormat(language, { hour: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, 0, 1, hour % 24)),
  )
}
