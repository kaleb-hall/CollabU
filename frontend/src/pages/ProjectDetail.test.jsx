import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import ProjectDetail from './ProjectDetail'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { notificationService } from '../services/notificationService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/projectService', () => ({
  projectService: { getProject: vi.fn(), getProjects: vi.fn(), removeMember: vi.fn(), getActivity: vi.fn(), getWorkload: vi.fn() },
}))
vi.mock('../services/taskService', () => ({
  taskService: { getProjectTasks: vi.fn(), updateTask: vi.fn(), updateTaskStatus: vi.fn(), deleteTask: vi.fn(), calculateSchedule: vi.fn() },
}))
vi.mock('../services/notificationService', () => ({
  notificationService: { unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}))
vi.mock('../services/fileService', () => ({ fileService: { list: vi.fn().mockResolvedValue({ files: [] }) } }))
vi.mock('../services/commentService', () => ({ commentService: { list: vi.fn().mockResolvedValue({ comments: [] }) } }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

const inDays = (days) => new Date(Date.now() + days * 864e5).toISOString()
const bea = { id: 1, first_name: 'Bea', last_name: 'Owner', full_name: 'Bea Owner', email: 'bea@example.com' }
const sam = { id: 2, first_name: 'Sam', last_name: 'Kim', full_name: 'Sam Kim', email: 'sam@example.com' }

const project = {
  id: 4, title: 'History essay', description: 'Bebop paper', deadline: inDays(20), status: 'active', created_by: 1,
  members: [{ id: 10, user_id: 1, role: 'admin', user: bea }, { id: 11, user_id: 2, role: 'member', user: sam }],
  task_counts: { total: 3, completed: 1 },
}

const task = (id, title, status, extra = {}) => ({
  id, project_id: 4, title, status, priority: 'medium', due_date: inDays(id), estimated_hours: 2,
  assigned_to: null, assignee: null, description: '', ...extra,
})

function setup({ user = bea } = {}) {
  const server = [task(1, 'Outline', 'todo'), task(2, 'Sources', 'in_progress', { assigned_to: 2, assignee: sam }), task(3, 'Pick topic', 'completed')]
  notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
  projectService.getProject.mockResolvedValue({ project })
  projectService.getProjects.mockResolvedValue({ projects: [project] })
  projectService.removeMember.mockResolvedValue()
  taskService.getProjectTasks.mockImplementation(async () => ({ tasks: server.map((t) => ({ ...t })) }))
  taskService.updateTaskStatus.mockImplementation(async (id, status) => {
    server.find((t) => t.id === id).status = status
    return { task: {} }
  })
  taskService.updateTask.mockResolvedValue({ task: {} })
  taskService.deleteTask.mockResolvedValue()
  taskService.calculateSchedule.mockResolvedValue({ schedule: {}, warnings: ['Sam Kim has a lot more work'] })
  renderWithProviders(<ProjectDetail />, { user, route: '/projects/4', path: '/projects/:id' })
}

const column = (name) => screen.findByRole('region', { name })

describe('Project page', () => {
  it('shows the project header', async () => {
    setup()
    expect(await screen.findByRole('heading', { level: 1, name: 'History essay' })).toBeInTheDocument()
    expect(screen.getByText('20 days left')).toBeInTheDocument()
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument()
  })

  it('puts each task in its status column', async () => {
    setup()
    expect(within(await column('To do')).getByText('Outline')).toBeInTheDocument()
    expect(within(await column('In progress')).getByText('Sources')).toBeInTheDocument()
    expect(within(await column('Done')).getByText('Pick topic')).toBeInTheDocument()
    expect(within(await column('Blocked')).getByText('Drop tasks here')).toBeInTheDocument()
  })

  it('moves a card with its menu', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Move "Outline"' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'In review' }))
    expect(within(await column('In review')).getByText('Outline')).toBeInTheDocument()
    expect(taskService.updateTaskStatus).toHaveBeenCalledWith(1, 'review')
  })

  it('opens a task in the side panel and saves changes', async () => {
    setup()
    await userEvent.click(await screen.findByText('Outline'))
    const panel = await screen.findByRole('dialog', { name: 'Task' })
    const title = within(panel).getByLabelText('Title')
    await userEvent.clear(title)
    await userEvent.type(title, 'Full outline')
    await userEvent.click(within(panel).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(taskService.updateTask).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Full outline', assigned_to: null })))
  })

  it('deletes a task after confirming', async () => {
    setup()
    await userEvent.click(await screen.findByText('Outline'))
    const panel = await screen.findByRole('dialog', { name: 'Task' })
    await userEvent.click(within(panel).getByRole('button', { name: 'Delete task' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete this task?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete task' }))
    await waitFor(() => expect(taskService.deleteTask).toHaveBeenCalledWith(1))
  })

  it('lets an admin remove a teammate but not the owner', async () => {
    setup()
    await userEvent.click(await screen.findByRole('tab', { name: 'Team' }))
    expect(screen.queryByRole('button', { name: 'Remove Bea Owner' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove Sam Kim' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(projectService.removeMember).toHaveBeenCalledWith(4, 11))
  })

  it('hides team controls from regular members', async () => {
    setup({ user: sam })
    await userEvent.click(await screen.findByRole('tab', { name: 'Team' }))
    expect(screen.queryByRole('button', { name: /Invite/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument()
  })

  it('plans the schedule and shows warnings', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Plan schedule' }))
    await waitFor(() => expect(taskService.calculateSchedule).toHaveBeenCalledWith('4', expect.any(String)))
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Sam Kim has a lot more work', expect.anything()))
  })

  it('explains when the project cannot be opened', async () => {
    setup()
    projectService.getProject.mockRejectedValue({ response: { status: 403, data: { error: { code: 'FORBIDDEN', message: 'You are not a member of this project' } } } })
    renderWithProviders(<ProjectDetail />, { user: bea, route: '/projects/9', path: '/projects/:id' })
    expect(await screen.findByText('You are not a member of this project')).toBeInTheDocument()
  })
})
