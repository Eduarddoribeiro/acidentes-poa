import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import DetalhePonto from '../components/DetalhePonto'
import PainelFiltros from '../components/PainelFiltros'
import Ranking from '../components/Ranking'
import { filtrosVazios } from '../filtros'
import i18n from '../i18n'
import { META, PONTOS } from './dados'

describe('Ranking', () => {
  it('mostra as faixas numeradas na ordem e chama "ver no mapa"', async () => {
    const aoVer = vi.fn()
    render(<Ranking pontos={PONTOS} selecionado={null} aoVerNoMapa={aoVer} />)

    const faixas = screen.getAllByRole('listitem')
    expect(faixas).toHaveLength(2)
    expect(faixas[0]).toHaveTextContent('1')
    expect(faixas[0]).toHaveTextContent('Av. Presidente Castelo Branco')
    expect(faixas[0]).toHaveTextContent('382')

    await userEvent.click(screen.getByRole('button', { name: /Av. Azenha/ }))
    expect(aoVer).toHaveBeenCalledWith(PONTOS[1])
  })

  it('marca a faixa selecionada', () => {
    render(<Ranking pontos={PONTOS} selecionado={PONTOS[0]} aoVerNoMapa={() => {}} />)

    expect(screen.getByRole('button', { name: /Castelo Branco/ })).toHaveAttribute('aria-current', 'true')
  })
})

describe('PainelFiltros', () => {
  function renderizar(aoMudar = vi.fn(), filtros = filtrosVazios(), ativos = 0) {
    render(
      <PainelFiltros
        filtros={filtros}
        aoMudar={aoMudar}
        aoLimpar={vi.fn()}
        periodoBase={META.periodo_base}
        periodoPadrao={META.periodo_padrao}
        viasDisponiveis={Object.keys(META.tipos_via)}
        ativos={ativos}
      />,
    )
    return aoMudar
  }

  it('todos os campos têm rótulo', () => {
    renderizar()

    expect(screen.getByLabelText('De')).toHaveValue('2021-01-01')
    expect(screen.getByLabelText('Até')).toHaveValue('2026-09-30')
    expect(screen.getByLabelText('Das')).toBeInTheDocument()
    expect(screen.getByLabelText('sábado')).toBeInTheDocument()
    expect(screen.getByLabelText('Avenida')).toBeInTheDocument()
  })

  it('não mostra tipo de via que não existe na base', () => {
    renderizar()

    expect(screen.queryByLabelText('Rodovia')).not.toBeInTheDocument()
  })

  it('marcar um dia atualiza os filtros', async () => {
    const aoMudar = renderizar()

    await userEvent.click(screen.getByLabelText('sábado'))

    expect(aoMudar).toHaveBeenCalledWith(expect.objectContaining({ dias: [5] }))
  })

  it('escolher hora inicial já propõe uma hora final', async () => {
    const aoMudar = renderizar()

    await userEvent.selectOptions(screen.getByLabelText('Das'), '22')

    expect(aoMudar).toHaveBeenCalledWith(expect.objectContaining({ horaInicio: 22, horaFim: 23 }))
  })

  it('"Limpar filtros" fica desabilitado sem filtro ativo', () => {
    renderizar()

    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeDisabled()
  })

  it('avisa quando o período está invertido', () => {
    renderizar(vi.fn(), { ...filtrosVazios(), inicio: '2025-01-01', fim: '2024-01-01' }, 1)

    expect(screen.getByRole('alert')).toHaveTextContent('A data inicial é depois da final')
  })
})

describe('DetalhePonto', () => {
  it('mostra quantidade, composição e período no formato do idioma', async () => {
    render(<DetalhePonto ponto={PONTOS[0]} raio={100} aoFechar={() => {}} />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Av. Presidente Castelo Branco')
    expect(screen.getByText('382')).toBeInTheDocument()
    expect(screen.getByText('Com mortos').closest('div')).toHaveTextContent('1')
    expect(screen.getByText('07/01/2021 a 23/09/2026')).toBeInTheDocument()

    await i18n.changeLanguage('en')
    expect(await screen.findByText('01/07/2021 to 09/23/2026')).toBeInTheDocument()
    await i18n.changeLanguage('pt-BR')
  })
})
