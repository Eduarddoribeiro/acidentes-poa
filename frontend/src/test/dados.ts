import type { Meta, PontoCritico } from '../api'

export const META: Meta = {
  fonte: { nome: '#DataPoa / EPTC', url: 'https://dadosabertos.poa.br/dataset/acidentes-de-transito-acidentes' },
  carga: {
    data_carga: '2026-10-27T00:04:33',
    data_extracao: '2026-10-01',
    total_lido: 87323,
    total_aceito: 80175,
    total_descartado: 7148,
    descartes_por_motivo: { sem_coordenada: 7144, data_posterior_a_extracao: 4 },
    percentual_fora_do_mapa: 8.2,
    percentual_sem_coordenada: 8.2,
  },
  periodo_base: { inicio: '2021-01-01', fim: '2026-09-30' },
  periodo_padrao: { inicio: '2021-01-01', fim: '2026-09-30' },
  criterio: { raio_metros: 100, n_minimo: 20 },
  tipos_via: { avenida: 46930, rua: 28139, estrada: 3642, outra: 1464 },
}

export const PONTOS: PontoCritico[] = [
  {
    id: 'a',
    posicao: 1,
    nome: 'Av. Presidente Castelo Branco',
    latitude: -30.0245,
    longitude: -51.2195,
    total: 382,
    sem_vitimas: 278,
    com_feridos: 103,
    com_mortos: 1,
    data_inicio: '2021-01-07',
    data_fim: '2026-09-23',
    regiao: 'CENTRO',
  },
  {
    id: 'b',
    posicao: 2,
    nome: 'Av. Azenha',
    latitude: -30.05,
    longitude: -51.21,
    total: 311,
    sem_vitimas: 200,
    com_feridos: 108,
    com_mortos: 3,
    data_inicio: '2021-02-01',
    data_fim: '2026-09-01',
    regiao: 'SUL',
  },
]
