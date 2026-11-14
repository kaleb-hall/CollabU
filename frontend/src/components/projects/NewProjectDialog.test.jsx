import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewProjectDialog from './NewProjectDialog'
import { projectService } from '../../services/projectService'
import { renderWithProviders } from '../../test/render'

vi.mock('../../services/projectService', () => ({
  projectService: { createProject: vi.fn() },
}))

describe('NewProjectDialog', () => {
  it('opens the new project right after it is created', async () => {
    projectService.createProject.mockResolvedValue({ project: { id: 42 } })
    renderWithProviders(<NewProjectDialog open onOpenChange={() => {}} />, { user: { id: 1 }, route: '/', path: '/' })

    await userEvent.click(screen.getByRole('button', { name: /Blank project/ }))
    await userEvent.type(screen.getByLabelText(/Title/), 'Lab report')
    await userEvent.type(screen.getByLabelText(/Deadline/), '2026-12-01T17:00')
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))

    expect(await screen.findByText('Landed on another page')).toBeInTheDocument()
  })
})
