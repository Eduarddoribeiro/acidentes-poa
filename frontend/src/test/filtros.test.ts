import { describe, expect, it } from 'vitest'
import { alternar, contarAtivos, filtrosVazios, horarioAtivo, paraConsulta, periodoValido } from '../filtros'

describe('filtros', () => {
  it('sem filtros não gera parâmetros nem conta ativos', () => {
    expect(paraConsulta(filtrosVazios())).toBe('')
    expect(contarAtivos(filtrosVazios())).toBe(0)
  })

  it('combina horário que passa da meia-noite com dia da semana (RN-04)', () => {
    const filtros = { ...filtrosVazios(), horaInicio: 22, horaFim: 2, dias: [5] }

    expect(paraConsulta(filtros)).toBe('?hora_inicio=22&hora_fim=2&dias=5')
    expect(contarAtivos(filtros)).toBe(2)
  })

  it('período igual ao padrão não conta como filtro ativo', () => {
    const padrao = { inicio: '2021-01-01', fim: '2026-09-30' }

    expect(contarAtivos({ ...filtrosVazios(), ...padrao }, padrao)).toBe(0)
    expect(contarAtivos({ ...filtrosVazios(), inicio: '2024-01-01' }, padrao)).toBe(1)
  })

  it('horário com início igual ao fim é o dia inteiro', () => {
    expect(horarioAtivo({ ...filtrosVazios(), horaInicio: 0, horaFim: 24 })).toBe(false)
    expect(horarioAtivo({ ...filtrosVazios(), horaInicio: 8, horaFim: 8 })).toBe(false)
  })

  it('ordena dias e vias para o mesmo recorte gerar a mesma consulta', () => {
    expect(paraConsulta({ ...filtrosVazios(), dias: [6, 0], vias: ['rua', 'avenida'] })).toBe(
      '?dias=0%2C6&vias=avenida%2Crua',
    )
  })

  it('valida período invertido', () => {
    expect(periodoValido({ ...filtrosVazios(), inicio: '2025-01-01', fim: '2024-01-01' })).toBe(false)
  })

  it('alternar inclui e retira', () => {
    expect(alternar([1, 2], 2)).toEqual([1])
    expect(alternar([1], 3)).toEqual([1, 3])
  })
})
