import { type Filtros, paraConsulta } from './filtros'

export interface Meta {
  fonte: { nome: string; url: string }
  carga: {
    data_carga: string
    data_extracao: string | null
    total_lido: number
    total_aceito: number
    total_descartado: number
    descartes_por_motivo: Record<string, number>
    percentual_fora_do_mapa: number
    percentual_sem_coordenada: number
  }
  periodo_base: { inicio: string; fim: string }
  periodo_padrao: { inicio: string; fim: string }
  criterio: { raio_metros: number; n_minimo: number }
  tipos_via: Record<string, number>
}

export interface PontoCritico {
  id: string
  posicao: number
  nome: string
  latitude: number
  longitude: number
  total: number
  sem_vitimas: number
  com_feridos: number
  com_mortos: number
  data_inicio: string
  data_fim: string
  regiao: string | null
}

export interface RespostaPontos {
  raio_metros: number
  n_minimo: number
  pontos: PontoCritico[]
}

/** Cada ponto do calor é [latitude, longitude, quantidade]. */
export interface RespostaCalor {
  total: number
  pontos: [number, number, number][]
}

export class ErroApi extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

async function obter<T>(caminho: string, sinal?: AbortSignal): Promise<T> {
  const resposta = await fetch(caminho, { signal: sinal })
  if (!resposta.ok) throw new ErroApi(`Falha em ${caminho}`, resposta.status)
  return (await resposta.json()) as T
}

export const api = {
  meta: (sinal?: AbortSignal) => obter<Meta>('/api/meta', sinal),
  pontos: (filtros: Filtros, sinal?: AbortSignal) =>
    obter<RespostaPontos>(`/api/pontos-criticos${paraConsulta(filtros)}`, sinal),
  calor: (filtros: Filtros, sinal?: AbortSignal) =>
    obter<RespostaCalor>(`/api/calor${paraConsulta(filtros)}`, sinal),
}
