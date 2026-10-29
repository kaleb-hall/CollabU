import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import WorkloadView from './WorkloadView'
import { projectService } from '../services/projectService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/projectService', () => ({ projectService: { getWorkload: vi.fn() } }))

describe('WorkloadView', () => {
  it('shows each member and flags anyone over capacity', async () => {
    projectService.getWorkload.mockResolvedValue({
      week_start: '2030-01-07T08:00:00Z',
      week_end: '2030-01-14T08:00:00Z',
      members: [
        { user_id: 1, name: 'Ana Lee', assigned_hours: 6, free_hours: 30, task_count: 2, overloaded: false },
        { user_id: 2, name: 'Sam Kim', assigned_hours: 40, free_hours: 12.5, task_count: 5, overloaded: true },
      ],
    })
    renderWithProviders(<WorkloadView projectId={4} />)

    const sam = (await screen.findByText('Sam Kim')).closest('li')
    expect(within(sam).getByText('40h of work, 12.5h free')).toBeInTheDocument()
    expect(within(sam).getByText('Over by 27.5h')).toBeInTheDocument()
    const ana = screen.getByText('Ana Lee').closest('li')
    expect(within(ana).queryByText(/Over by/)).not.toBeInTheDocument()
    expect(screen.getByText(/Jan 7 to Jan 13/)).toBeInTheDocument()
  })
})
