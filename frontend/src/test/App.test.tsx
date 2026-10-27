import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import i18n from '../i18n'
import { META, PONTOS } from './dados'

// O Leaflet não funciona no jsdom; o mapa é conferido no navegador.
vi.mock('../components/Mapa', () => ({ default: () => <div data-testid="mapa" /> }))

type Rota = unknown | (() => Response)

function responder(rotas: Record<string, Rota>) {
  return vi.fn(async (url: string) => {
    const caminho = Object.keys(rotas).find((r) => url.startsWith(r))
    if (!caminho) return new Response('{}', { status: 404 })
    const valor = rotas[caminho]
    return typeof valor === 'function' ? (valor as () => Response)() : new Response(JSON.stringify(valor))
  })
}

const PONTOS_OK = { raio_metros: 100, n_minimo: 20, pontos: PONTOS }

beforeEach(() => {
  window.location.hash = ''
  window.matchMedia = vi.fn().mockImplementation((consulta: string) => ({
    matches: consulta.includes('min-width'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('App', () => {
  it('carrega o ranking com os pontos críticos', async () => {
    vi.stubGlobal(
      'fetch',
      responder({ '/api/meta': META, '/api/pontos-criticos': PONTOS_OK, '/api/calor': { total: 80175, pontos: [] } }),
    )
    render(<App />)

    expect(await screen.findByRole('button', { name: /Castelo Branco/ })).toBeInTheDocument()
    expect(screen.getByText(/2 locais com 20 ou mais acidentes num raio de 100 m/)).toBeInTheDocument()
    expect(screen.getByText(/80\.175 acidentes no recorte/)).toBeInTheDocument()
    // Versão em tabela para leitor de tela.
    expect(screen.getByRole('table')).toHaveTextContent('Av. Azenha')
  })

  it('clicar numa faixa abre o detalhe do ponto', async () => {
    vi.stubGlobal(
      'fetch',
      responder({ '/api/meta': META, '/api/pontos-criticos': PONTOS_OK, '/api/calor': { total: 10, pontos: [] } }),
    )
    render(<App />)

    await userEvent.click(await screen.findByRole('button', { name: /Av. Azenha/ }))

    expect(screen.getByRole('heading', { level: 2, name: /Av. Azenha/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Fechar detalhe' }))
    expect(screen.getByRole('list', { name: 'Pontos críticos' })).toBeInTheDocument()
    // O foco volta para a faixa que abriu o detalhe.
    await waitFor(() => expect(screen.getByRole('button', { name: /Av. Azenha/ })).toHaveFocus())
  })

  it('se a API cair, o erro mostra a data da última base que carregou', async () => {
    localStorage.setItem('acidentes-poa:data-base', '2026-10-01')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('erro', { status: 503 })))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Última atualização da base: 01/10/2026.')
  })

  it('sem resultados oferece limpar filtros', async () => {
    vi.stubGlobal(
      'fetch',
      responder({
        '/api/meta': META,
        '/api/pontos-criticos': { raio_metros: 100, n_minimo: 20, pontos: [] },
        '/api/calor': { total: 0, pontos: [] },
      }),
    )
    render(<App />)

    expect(await screen.findByText('Nenhum ponto crítico neste recorte')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Limpar filtros' }).length).toBeGreaterThan(0)
  })

  it('erro de carga mostra a data da última atualização da base', async () => {
    vi.stubGlobal(
      'fetch',
      responder({
        '/api/meta': META,
        '/api/pontos-criticos': () => new Response('erro', { status: 500 }),
        '/api/calor': { total: 0, pontos: [] },
      }),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<App />)

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Os dados não carregaram')
    expect(alerta).toHaveTextContent('Última atualização da base: 01/10/2026.')
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('troca o idioma pelo seletor do cabeçalho', async () => {
    vi.stubGlobal(
      'fetch',
      responder({ '/api/meta': META, '/api/pontos-criticos': PONTOS_OK, '/api/calor': { total: 0, pontos: [] } }),
    )
    render(<App />)

    await userEvent.selectOptions(screen.getByLabelText('Idioma'), 'en')

    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
    expect(screen.getByRole('link', { name: 'Methodology' })).toBeInTheDocument()
    await i18n.changeLanguage('pt-BR')
  })

  it('metodologia mostra critério, descartes e ressalva', async () => {
    window.location.hash = '#/metodologia'
    vi.stubGlobal('fetch', responder({ '/api/meta': META }))
    render(<App />)

    expect(await screen.findByText(/20 ou mais acidentes num raio de 100 m/)).toBeInTheDocument()
    expect(screen.getByText(/De 87\.323 registros lidos, 7\.148 ficaram fora do mapa \(8,2\s?%\)/)).toBeInTheDocument()
    expect(screen.getByText('Data posterior à extração da base')).toBeInTheDocument()
    expect(screen.getByText(/não culpa de condutores nem causa/)).toBeInTheDocument()
  })
})
