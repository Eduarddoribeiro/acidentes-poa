/** Datas e números formatados conforme o idioma (M12). */

export function formatarNumero(valor: number, idioma: string): string {
  return new Intl.NumberFormat(idioma).format(valor)
}

export function formatarPercentual(valor: number, idioma: string): string {
  return new Intl.NumberFormat(idioma, { style: 'percent', maximumFractionDigits: 1 }).format(valor / 100)
}

/** Recebe 'AAAA-MM-DD' (ou ISO com hora) e mostra a data no formato do idioma, sem fuso. */
export function formatarData(iso: string | null | undefined, idioma: string): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat(idioma, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(ano, mes - 1, dia)),
  )
}

export function formatarHora(hora: number, idioma: string): string {
  return new Intl.DateTimeFormat(idioma, { hour: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, hora % 24)))
}
