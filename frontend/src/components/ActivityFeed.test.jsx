import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityFeed from './ActivityFeed'
import { projectService } from '../services/projectService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/projectService', () => ({ projectService: { getActivity: vi.fn() } }))

const entry = (id, description) => ({ id, description, created_at: new Date().toISOString(), action: 'task_created' })

describe('ActivityFeed', () => {
  it('shows entries and loads older ones', async () => {
    projectService.getActivity
      .mockResolvedValueOnce({ activities: [entry(3, 'Ana Lee created "C"'), entry(2, 'Ana Lee created "B"')], next_cursor: 2 })
      .mockResolvedValueOnce({ activities: [entry(1, 'Ana Lee created "A"')], next_cursor: null })
    renderWithProviders(<ActivityFeed projectId={4} />)

    expect(await screen.findByText('Ana Lee created "C"')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Show older' }))
    expect(await screen.findByText('Ana Lee created "A"')).toBeInTheDocument()
    expect(projectService.getActivity).toHaveBeenLastCalledWith(4, 2)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Show older' })).not.toBeInTheDocument())
  })

  it('has an empty state', async () => {
    projectService.getActivity.mockResolvedValue({ activities: [], next_cursor: null })
    renderWithProviders(<ActivityFeed projectId={4} />)
    expect(await screen.findByText(/Nothing has happened yet/)).toBeInTheDocument()
  })
})
