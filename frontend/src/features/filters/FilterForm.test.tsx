import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { METADATA } from '../../test/fixtures'
import { FilterForm } from './FilterForm'
import { emptyFilters } from './model'

describe('FilterForm', () => {
  function renderForm(onChange = vi.fn(), filters = emptyFilters(), activeCount = 0) {
    render(
      <FilterForm
        filters={filters}
        onChange={onChange}
        onClear={vi.fn()}
        datasetPeriod={METADATA.dataset_period}
        defaultPeriod={METADATA.default_period}
        availableRoadTypes={Object.keys(METADATA.road_types)}
        activeCount={activeCount}
      />,
    )
    return onChange
  }

  it('every field has a label', () => {
    renderForm()

    expect(screen.getByLabelText('De')).toHaveValue('2021-01-01')
    expect(screen.getByLabelText('Até')).toHaveValue('2026-09-30')
    expect(screen.getByLabelText('Das')).toBeInTheDocument()
    expect(screen.getByLabelText('sábado')).toBeInTheDocument()
    expect(screen.getByLabelText('Avenida')).toBeInTheDocument()
  })

  it('does not offer a road type missing from the dataset', () => {
    renderForm()

    expect(screen.queryByLabelText('Rodovia')).not.toBeInTheDocument()
  })

  it('checking a weekday updates the filters', async () => {
    const onChange = renderForm()

    await userEvent.click(screen.getByLabelText('sábado'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ weekdays: [5] }))
  })

  it('choosing a start hour proposes an end hour', async () => {
    const onChange = renderForm()

    await userEvent.selectOptions(screen.getByLabelText('Das'), '22')

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ hourStart: 22, hourEnd: 23 }))
  })

  it('"Limpar filtros" is disabled without an active filter', () => {
    renderForm()

    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeDisabled()
  })

  it('warns when the period is inverted', () => {
    renderForm(vi.fn(), { ...emptyFilters(), start: '2025-01-01', end: '2024-01-01' }, 1)

    expect(screen.getByRole('alert')).toHaveTextContent('A data inicial é depois da final')
  })
})
