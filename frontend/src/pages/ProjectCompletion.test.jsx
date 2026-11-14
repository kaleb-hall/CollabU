import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectDetail from './ProjectDetail'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { notificationService } from '../services/notificationService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/projectService', () => ({
  projectService: {
    getProject: vi.fn(), getProjects: vi.fn(), getActivity: vi.fn(), getWorkload: vi.fn(),
    complete: vi.fn(), reopen: vi.fn(), setLocked: vi.fn(), setArchived: vi.fn(),
    sendFinalNote: vi.fn(), getSummary: vi.fn(), updateMySettings: vi.fn(),
  },
}))
vi.mock('../services/taskService', () => ({ taskService: { getProjectTasks: vi.fn() } }))
vi.mock('../services/notificationService', () => ({
  notificationService: { unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}))
vi.mock('../services/fileService', () => ({ fileService: { list: vi.fn().mockResolvedValue({ files: [] }) } }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

const inDays = (days) => new Date(Date.now() + days * 864e5).toISOString()
const bea = { id: 1, first_name: 'Bea', last_name: 'Owner', full_name: 'Bea Owner', email: 'bea@example.com' }
const sam = { id: 2, first_name: 'Sam', last_name: 'Kim', full_name: 'Sam Kim', email: 'sam@example.com' }

const baseProject = {
  id: 4, title: 'History essay', description: '', deadline: inDays(20), status: 'active', created_by: 1,
  created_at: inDays(-12), completed_at: null, completed_by: null, final_note: null, locked: false, archived_at: null,
  task_counts: { total: 2, completed: 1 },
  members: [
    { id: 10, user_id: 1, role: 'admin', email_updates: true, user: bea },
    { id: 11, user_id: 2, role: 'member', email_updates: true, user: sam },
  ],
}

const task = (id, title, status) => ({
  id, project_id: 4, title, status, priority: 'medium', due_date: inDays(id), estimated_hours: 2,
  assigned_to: 2, assignee: sam, description: '',
})

const open = [task(1, 'Outline', 'todo'), task(2, 'Sources', 'completed')]
const allDone = [task(1, 'Outline', 'completed'), task(2, 'Sources', 'completed')]

function setup({ user = bea, project = {}, tasks = open } = {}) {
  const current = { ...baseProject, ...project }
  notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
  projectService.getProject.mockResolvedValue({ project: current })
  projectService.getProjects.mockResolvedValue({ projects: [current] })
  projectService.getActivity.mockResolvedValue({ activities: [], next_cursor: null })
  projectService.complete.mockResolvedValue({
    project: { ...current, status: 'completed', locked: true, completed_at: new Date().toISOString(), completed_by: user.id },
  })
  projectService.sendFinalNote.mockResolvedValue({ project: { ...current, final_note: 'Thanks all' } })
  projectService.setLocked.mockResolvedValue({ project: { ...current, locked: true } })
  projectService.updateMySettings.mockResolvedValue({})
  projectService.getSummary.mockResolvedValue({
    started_at: inDays(-12), completed_at: inDays(0), completed_by: bea, final_note: 'We did it',
    completed_tasks: [{ id: 2, title: 'Sources', completed_at: inDays(-1), assignee: sam }],
    open_task_count: 1,
    contributors: [{ user: sam, tasks_completed: 1 }],
    files: [{ id: 7, filename: 'essay.pdf', size: 2048 }],
  })
  taskService.getProjectTasks.mockResolvedValue({ tasks })
  renderWithProviders(<ProjectDetail />, { user, route: '/projects/4', path: '/projects/:id' })
}

const heading = () => screen.findByRole('heading', { level: 1, name: 'History essay' })

describe('Finishing a project', () => {
  it('hides Complete from members while tasks are open', async () => {
    setup({ user: sam })
    await heading()
    expect(screen.queryByRole('button', { name: 'Complete project' })).not.toBeInTheDocument()
  })

  it('asks the creator first when tasks are still open', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Complete project' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('1 task is still open')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Complete anyway' }))

    await waitFor(() => expect(projectService.complete).toHaveBeenCalledWith('4'))
  })

  it('offers everyone the finish once all tasks are done, then celebrates', async () => {
    setup({ user: sam, tasks: allDone })
    const strip = await screen.findByText(/All tasks are done/)
    await userEvent.click(within(strip.closest('[role="status"]')).getByRole('button', { name: 'Complete project' }))

    expect(await screen.findByRole('heading', { name: 'Project complete!' })).toBeInTheDocument()
    expect(screen.getByText('2 tasks done in 12 days')).toBeInTheDocument()
  })

  it('sends the final note after the celebration', async () => {
    setup({ tasks: allDone })
    await userEvent.click((await screen.findAllByRole('button', { name: 'Complete project' }))[0])

    const note = await screen.findByLabelText('Send the team a final note', {}, { timeout: 3000 })
    await userEvent.type(note, 'Thanks all')
    await userEvent.click(screen.getByRole('button', { name: 'Send note' }))

    await waitFor(() => expect(projectService.sendFinalNote).toHaveBeenCalledWith(4, 'Thanks all'))
  })

  it('shows the summary on a completed project', async () => {
    setup({ project: { status: 'completed', locked: true, completed_at: inDays(0), completed_by: 1 } })

    const summary = await screen.findByRole('region', { name: 'Project summary' })
    expect(within(summary).getByText(/took/i)).toHaveTextContent('Took 12 days, finished by Bea Owner')
    expect(within(summary).getByText(/We did it/)).toBeInTheDocument()
    expect(within(summary).getByRole('list', { name: 'Who contributed' })).toHaveTextContent('Sam Kim1 task')
    expect(within(summary).getByText('essay.pdf')).toBeInTheDocument()
  })
})

describe('Locked projects', () => {
  it('hide the editing buttons and say so', async () => {
    setup({ project: { locked: true } })
    await heading()

    expect(screen.getByText('Locked')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add task/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Move "Outline"' })).not.toBeInTheDocument()
  })
})

describe('Project options', () => {
  it('let admins lock the project', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Project options' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Lock project' }))

    await waitFor(() => expect(projectService.setLocked).toHaveBeenCalledWith(4, true))
  })

  it('only show members the email switch', async () => {
    setup({ user: sam })
    await userEvent.click(await screen.findByRole('button', { name: 'Project options' }))

    const toggle = await screen.findByRole('menuitemcheckbox', { name: /Email me big updates/ })
    expect(screen.queryByRole('menuitem', { name: 'Lock project' })).not.toBeInTheDocument()
    await userEvent.click(toggle)

    await waitFor(() => expect(projectService.updateMySettings).toHaveBeenCalledWith(4, { email_updates: false }))
  })
})
