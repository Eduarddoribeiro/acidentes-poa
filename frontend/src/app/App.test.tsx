import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../shared/i18n'
import { HOTSPOTS, METADATA } from '../test/fixtures'
import App from './App'

// Leaflet does not run in jsdom; the map is checked in the browser.
vi.mock('../features/map/HotspotMap', () => ({ HotspotMap: () => <div data-testid="map" /> }))

type Route = unknown | (() => Response)

function respond(routes: Record<string, Route>) {
  return vi.fn(async (url: string) => {
    const path = Object.keys(routes).find((r) => url.startsWith(r))
    if (!path) return new Response('{}', { status: 404 })
    const value = routes[path]
    return typeof value === 'function' ? (value as () => Response)() : new Response(JSON.stringify(value))
  })
}

const HOTSPOT_LIST = { radius_meters: 100, min_accidents: 20, hotspots: HOTSPOTS }

beforeEach(() => {
  window.location.hash = ''
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('min-width'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('App', () => {
  it('loads the ranking with the hotspots', async () => {
    vi.stubGlobal(
      'fetch',
      respond({ '/api/metadata': METADATA, '/api/hotspots': HOTSPOT_LIST, '/api/heatmap': { total: 80175, points: [] } }),
    )
    render(<App />)

    expect(await screen.findByRole('button', { name: /Castelo Branco/ })).toBeInTheDocument()
    expect(screen.getByText(/2 locais com 20 ou mais acidentes num raio de 100 m/)).toBeInTheDocument()
    expect(screen.getByText(/80\.175 acidentes no recorte/)).toBeInTheDocument()
    // Table version for screen readers.
    expect(screen.getByRole('table')).toHaveTextContent('Av. Azenha')
  })

  it('clicking a band opens the hotspot detail', async () => {
    vi.stubGlobal(
      'fetch',
      respond({ '/api/metadata': METADATA, '/api/hotspots': HOTSPOT_LIST, '/api/heatmap': { total: 10, points: [] } }),
    )
    render(<App />)

    await userEvent.click(await screen.findByRole('button', { name: /Av. Azenha/ }))

    expect(screen.getByRole('heading', { level: 2, name: /Av. Azenha/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Fechar detalhe' }))
    expect(screen.getByRole('list', { name: 'Pontos críticos' })).toBeInTheDocument()
    // Focus returns to the band that opened the detail.
    await waitFor(() => expect(screen.getByRole('button', { name: /Av. Azenha/ })).toHaveFocus())
  })

  it('when the API is down, the error shows the date of the last dataset that loaded', async () => {
    localStorage.setItem('acidentes-poa:last-dataset-date', '2026-10-01')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('error', { status: 503 })))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Última atualização da base: 01/10/2026.')
  })

  it.each([
    [937, /O recorte tem 937 acidentes, mas nenhum local reúne 20 ou mais num raio de 100 m\. Em períodos curtos/],
    [0, /Nenhum acidente registrado neste recorte/],
  ])('no results with %i accidents explains why and offers to clear the filters', async (total, text) => {
    vi.stubGlobal(
      'fetch',
      respond({
        '/api/metadata': METADATA,
        '/api/hotspots': { radius_meters: 100, min_accidents: 20, hotspots: [] },
        '/api/heatmap': { total, points: [] },
      }),
    )
    render(<App />)

    expect(await screen.findByText('Nenhum ponto crítico neste recorte')).toBeInTheDocument()
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Limpar filtros' }).length).toBeGreaterThan(0)
  })

  it('a load error shows the date of the last dataset update', async () => {
    vi.stubGlobal(
      'fetch',
      respond({
        '/api/metadata': METADATA,
        '/api/hotspots': () => new Response('error', { status: 500 }),
        '/api/heatmap': { total: 0, points: [] },
      }),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Os dados não carregaram')
    expect(alert).toHaveTextContent('Última atualização da base: 01/10/2026.')
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('switches the language from the header', async () => {
    vi.stubGlobal(
      'fetch',
      respond({ '/api/metadata': METADATA, '/api/hotspots': HOTSPOT_LIST, '/api/heatmap': { total: 0, points: [] } }),
    )
    render(<App />)

    await userEvent.selectOptions(screen.getByLabelText('Idioma'), 'en')

    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
    expect(screen.getByRole('link', { name: 'Methodology' })).toBeInTheDocument()
    await i18n.changeLanguage('pt-BR')
  })

  it.each(['#/methodology', '#/metodologia'])('methodology (%s) shows criteria, discards and caveat', async (hash) => {
    window.location.hash = hash
    vi.stubGlobal('fetch', respond({ '/api/metadata': METADATA }))
    render(<App />)

    expect(await screen.findByText(/20 ou mais acidentes num raio de 100 m/)).toBeInTheDocument()
    expect(screen.getByText(/De 87\.323 registros lidos, 7\.148 ficaram fora do mapa \(8,2\s?%\)/)).toBeInTheDocument()
    expect(screen.getByText('Data posterior à extração da base')).toBeInTheDocument()
    expect(screen.getByText(/não culpa de condutores nem causa/)).toBeInTheDocument()
  })
})
