import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '../../shared/i18n'
import { HOTSPOTS } from '../../test/fixtures'
import { HotspotDetail } from './HotspotDetail'

describe('HotspotDetail', () => {
  it('shows count, composition and period in the language format', async () => {
    render(<HotspotDetail hotspot={HOTSPOTS[0]} radius={100} onClose={() => {}} />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Av. Presidente Castelo Branco')
    expect(screen.getByText('382')).toBeInTheDocument()
    expect(screen.getByText('Com mortos').closest('div')).toHaveTextContent('1')
    expect(screen.getByText('07/01/2021 a 23/09/2026')).toBeInTheDocument()

    await i18n.changeLanguage('en')
    expect(await screen.findByText('01/07/2021 to 09/23/2026')).toBeInTheDocument()
    await i18n.changeLanguage('pt-BR')
  })
})
