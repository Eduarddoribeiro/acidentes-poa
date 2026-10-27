/** Filtros do painel. Combinam entre si (RN-04). */
export interface Filtros {
  inicio: string | null
  fim: string | null
  /** Hora inicial inclusiva, de 0 a 23. */
  horaInicio: number | null
  /** Hora final exclusiva, de 1 a 24. Menor que a inicial quando passa da meia-noite. */
  horaFim: number | null
  /** 0 = segunda, 6 = domingo. */
  dias: number[]
  vias: string[]
}

export const TIPOS_VIA = ['avenida', 'rua', 'estrada', 'rodovia', 'outra'] as const

export function filtrosVazios(): Filtros {
  return { inicio: null, fim: null, horaInicio: null, horaFim: null, dias: [], vias: [] }
}

/** Período e horário contam como um filtro cada; dias e vias também. */
export function contarAtivos(filtros: Filtros, periodoPadrao?: { inicio: string; fim: string }): number {
  let ativos = 0
  const periodoMudou =
    (filtros.inicio !== null && filtros.inicio !== periodoPadrao?.inicio) ||
    (filtros.fim !== null && filtros.fim !== periodoPadrao?.fim)
  if (periodoMudou) ativos++
  if (horarioAtivo(filtros)) ativos++
  if (filtros.dias.length > 0) ativos++
  if (filtros.vias.length > 0) ativos++
  return ativos
}

export function horarioAtivo(filtros: Filtros): boolean {
  return filtros.horaInicio !== null && filtros.horaFim !== null && filtros.horaInicio !== filtros.horaFim % 24
}

export function periodoValido(filtros: Filtros): boolean {
  return !filtros.inicio || !filtros.fim || filtros.inicio <= filtros.fim
}

export function paraConsulta(filtros: Filtros): string {
  const parametros = new URLSearchParams()
  if (filtros.inicio) parametros.set('inicio', filtros.inicio)
  if (filtros.fim) parametros.set('fim', filtros.fim)
  if (horarioAtivo(filtros)) {
    parametros.set('hora_inicio', String(filtros.horaInicio))
    parametros.set('hora_fim', String(filtros.horaFim))
  }
  if (filtros.dias.length) parametros.set('dias', [...filtros.dias].sort().join(','))
  if (filtros.vias.length) parametros.set('vias', [...filtros.vias].sort().join(','))
  const texto = parametros.toString()
  return texto ? `?${texto}` : ''
}

export function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor]
}
