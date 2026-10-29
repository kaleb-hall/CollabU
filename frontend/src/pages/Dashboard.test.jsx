import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { notificationService } from '../services/notificationService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/projectService', () => ({ projectService: { getProjects: vi.fn(), createProject: vi.fn() } }))
vi.mock('../services/taskService', () => ({ taskService: { getMyTasks: vi.fn() } }))
vi.mock('../services/notificationService', () => ({
  notificationService: { unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}))

const inDays = (days) => new Date(Date.now() + days * 864e5).toISOString()
const user = { id: 1, first_name: 'Bea', last_name: 'Owner', email: 'bea@example.com' }

const project = (overrides) => ({
  id: 1,
  title: 'History essay',
  deadline: inDays(20),
  status: 'active',
  members: [{ user_id: 1, user: { first_name: 'Bea', last_name: 'Owner' } }, { user_id: 2, user: { first_name: 'Sam', last_name: 'Kim' } }],
  task_counts: { todo: 2, in_progress: 1, review: 0, blocked: 0, completed: 1, total: 4 },
  next_task: { id: 9, title: 'Find sources', due_date: inDays(2) },
  ...overrides,
})

function setup({ projects = [project()], tasks = [], projectsError } = {}) {
  notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
  if (projectsError) projectService.getProjects.mockRejectedValue(projectsError)
  else projectService.getProjects.mockResolvedValue({ projects })
  taskService.getMyTasks.mockResolvedValue({ tasks })
  projectService.createProject.mockResolvedValue({ project: { id: 5 }, suggestions: { tasks_created: 7 } })
  return renderWithProviders(<Dashboard />, { user, route: '/dashboard', path: '/dashboard' })
}

describe('Dashboard', () => {
  it('shows skeletons while loading', () => {
    projectService.getProjects.mockReturnValue(new Promise(() => {}))
    taskService.getMyTasks.mockReturnValue(new Promise(() => {}))
    notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
    renderWithProviders(<Dashboard />, { user, route: '/dashboard', path: '/dashboard' })
    expect(screen.getByRole('status', { name: 'Loading your desk' })).toBeInTheDocument()
  })

  it('greets the user by first name', async () => {
    setup()
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Bea')
  })

  it('shows each project with progress, deadline and next task', async () => {
    setup()
    const card = (await screen.findByRole('link', { name: /History essay/ }))
    expect(card).toHaveAttribute('href', '/projects/1')
    expect(within(card).getByText('1 of 4 done')).toBeInTheDocument()
    expect(within(card).getByText('20 days left')).toBeInTheDocument()
    expect(within(card).getByText('Find sources')).toBeInTheDocument()
  })

  it('marks a project as urgent when the deadline is close', async () => {
    setup({ projects: [project({ deadline: inDays(2) })] })
    const label = await screen.findByText('2 days left')
    expect(label.closest('[data-urgent]')).toHaveAttribute('data-urgent', 'true')
  })

  it('only shows active projects', async () => {
    setup({ projects: [project(), project({ id: 2, title: 'Old lab', status: 'archived' })] })
    await screen.findByText('History essay')
    expect(screen.queryByText('Old lab')).not.toBeInTheDocument()
  })

  it('lists my open tasks by due date with late ones flagged', async () => {
    setup({
      tasks: [
        { id: 1, title: 'Late outline', due_date: inDays(-2), status: 'todo', project: { id: 1, title: 'History essay' } },
        { id: 2, title: 'Slides', due_date: inDays(4), status: 'in_progress', project: { id: 1, title: 'History essay' } },
        { id: 3, title: 'Done thing', due_date: inDays(1), status: 'completed', project: { id: 1, title: 'History essay' } },
      ],
    })
    const dueSoon = await screen.findByRole('region', { name: 'Due soon' })
    const rows = await within(dueSoon).findAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('LATE')
    expect(rows[0]).toHaveTextContent('Late outline')
    expect(rows[1]).toHaveTextContent('Slides')
  })

  it('has a friendly empty state with a way to start', async () => {
    setup({ projects: [] })
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
    expect(await screen.findByText(/Nothing due/)).toBeInTheDocument()
  })

  it('shows an error with a retry button', async () => {
    setup({ projectsError: { request: {} } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server')
    projectService.getProjects.mockResolvedValue({ projects: [project()] })
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('History essay')).toBeInTheDocument()
  })

  it('creates a project from a template', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'New project' }))
    await userEvent.click(await screen.findByRole('button', { name: /Lab report/ }))
    await userEvent.type(screen.getByLabelText('Title'), 'Chem lab')
    await userEvent.type(screen.getByLabelText('Deadline'), '2030-03-01T17:00')
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))

    await waitFor(() => expect(projectService.createProject).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Chem lab',
      deadline: '2030-03-02T01:00:00.000Z',
      auto_generate_tasks: true,
      template: 'lab_experiment',
    })))
  })

  it('creates a blank project without suggested tasks', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'New project' }))
    await userEvent.click(await screen.findByRole('button', { name: /Blank project/ }))
    await userEvent.type(screen.getByLabelText('Title'), 'Side quest')
    await userEvent.type(screen.getByLabelText('Deadline'), '2030-03-01T17:00')
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))
    await waitFor(() => expect(projectService.createProject).toHaveBeenCalledWith(expect.objectContaining({
      auto_generate_tasks: false, template: null,
    })))
  })
})
