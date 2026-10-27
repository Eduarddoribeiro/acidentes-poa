import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HOTSPOTS } from '../../test/fixtures'
import { HotspotRanking } from './HotspotRanking'

describe('HotspotRanking', () => {
  it('shows the numbered bands in order and calls "show on map"', async () => {
    const onShow = vi.fn()
    render(<HotspotRanking hotspots={HOTSPOTS} selected={null} onShowOnMap={onShow} />)

    const bands = screen.getAllByRole('listitem')
    expect(bands).toHaveLength(2)
    expect(bands[0]).toHaveTextContent('1')
    expect(bands[0]).toHaveTextContent('Av. Presidente Castelo Branco')
    expect(bands[0]).toHaveTextContent('382')

    await userEvent.click(screen.getByRole('button', { name: /Av. Azenha/ }))
    expect(onShow).toHaveBeenCalledWith(HOTSPOTS[1])
  })

  it('marks the selected band', () => {
    render(<HotspotRanking hotspots={HOTSPOTS} selected={HOTSPOTS[0]} onShowOnMap={() => {}} />)

    expect(screen.getByRole('button', { name: /Castelo Branco/ })).toHaveAttribute('aria-current', 'true')
  })

  it('names a place without a street in the dataset', () => {
    render(<HotspotRanking hotspots={[{ ...HOTSPOTS[0], name: null }]} selected={null} onShowOnMap={() => {}} />)

    expect(screen.getByRole('button', { name: /Local sem nome na base/ })).toBeInTheDocument()
  })
})
