import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import Dashboard from './Dashboard'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { notificationService } from '../services/notificationService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/projectService', () => ({ projectService: { getProjects: vi.fn(), createProject: vi.fn() } }))
vi.mock('../services/taskService', () => ({ taskService: { getMyTasks: vi.fn(), updateTaskStatus: vi.fn(), createTask: vi.fn() } }))
vi.mock('../services/notificationService', () => ({
  notificationService: { unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

const inDays = (days) => new Date(Date.now() + days * 864e5).toISOString()
const user = { id: 1, first_name: 'Bea', last_name: 'Owner', email: 'bea@example.com' }
const essay = { id: 1, title: 'History essay' }

const project = (overrides) => ({
  id: 1,
  title: 'History essay',
  deadline: inDays(20),
  status: 'active',
  members: [{ user_id: 1, user: { first_name: 'Bea', last_name: 'Owner' } }],
  task_counts: { todo: 2, in_progress: 1, review: 0, blocked: 0, completed: 2, total: 5 },
  next_task: null,
  ...overrides,
})

const myTasks = [
  { id: 11, title: 'Late outline', due_date: inDays(-2), status: 'todo', project_id: 1, project: essay },
  { id: 12, title: 'Find sources', due_date: inDays(0.01), status: 'review', project_id: 1, project: essay },
  { id: 13, title: 'Draft intro', due_date: inDays(3), status: 'in_progress', project_id: 1, project: essay },
  { id: 14, title: 'Final edit', due_date: inDays(20), status: 'todo', project_id: 1, project: essay },
  { id: 15, title: 'Done already', due_date: inDays(1), status: 'completed', project_id: 1, project: essay },
]

function setup({ projects = [project()], tasks = myTasks, error } = {}) {
  notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
  if (error) projectService.getProjects.mockRejectedValue(error)
  else projectService.getProjects.mockResolvedValue({ projects })
  // A tiny fake server that remembers status changes, so refetches see them
  const server = tasks.map((task) => ({ ...task }))
  taskService.getMyTasks.mockImplementation(async () => ({ tasks: server.map((task) => ({ ...task })) }))
  taskService.updateTaskStatus.mockImplementation(async (id, status) => {
    server.find((task) => task.id === id).status = status
    return { task: {} }
  })
  return renderWithProviders(<Dashboard />, { user, route: '/dashboard', path: '/dashboard' })
}

const myWork = () => screen.findByRole('region', { name: 'My work' })

describe('Home', () => {
  it('shows skeletons while loading', () => {
    projectService.getProjects.mockReturnValue(new Promise(() => {}))
    taskService.getMyTasks.mockReturnValue(new Promise(() => {}))
    notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
    renderWithProviders(<Dashboard />, { user, route: '/dashboard', path: '/dashboard' })
    expect(screen.getByRole('status', { name: 'Loading your work' })).toBeInTheDocument()
  })

  it('has a small title and a one line summary', async () => {
    setup()
    const title = await screen.findByRole('heading', { level: 1, name: 'Home' })
    expect(title.nextElementSibling).toHaveTextContent('4 open, 1 late')
  })

  it('groups my open tasks into late, today, next 7 days and later', async () => {
    setup()
    const region = await myWork()
    const headings = within(region).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Late1', 'Today1', 'Next 7 days1', 'Later1'])
    expect(within(region).queryByText('Done already')).not.toBeInTheDocument()
  })

  it('shows status labels except for plain to do', async () => {
    setup()
    const region = await myWork()
    const row = (title) => within(region).getByText(title).closest('li')
    expect(within(row('Find sources')).getByText('In review')).toBeInTheDocument()
    expect(within(row('Draft intro')).getByText('In progress')).toBeInTheDocument()
    expect(within(row('Late outline')).queryByText('To do')).not.toBeInTheDocument()
    expect(row('Late outline')).toHaveTextContent('2d late')
  })

  it('checks a task off right away and offers undo', async () => {
    setup()
    const region = await myWork()
    await userEvent.click(within(region).getByRole('checkbox', { name: 'Mark "Draft intro" done' }))
    await waitFor(() => expect(within(region).queryByText('Draft intro')).not.toBeInTheDocument())
    expect(taskService.updateTaskStatus).toHaveBeenCalledWith(13, 'completed')

    const [, options] = toast.mock.calls.at(-1)
    options.action.onClick()
    await waitFor(() => expect(taskService.updateTaskStatus).toHaveBeenLastCalledWith(13, 'in_progress'))
    expect(await within(region).findByText('Draft intro')).toBeInTheDocument()
  })

  it('ticks the box and lets the row drift away before it disappears', async () => {
    setup()
    const region = await myWork()
    const box = within(region).getByRole('checkbox', { name: 'Mark "Draft intro" done' })
    await userEvent.click(box)

    // Right after the click: ticked, struck through, leaving, and not saved yet
    expect(box).toHaveAttribute('aria-checked', 'true')
    const row = within(region).getByText('Draft intro').closest('li')
    expect(row).toHaveAttribute('data-leaving', 'true')
    expect(taskService.updateTaskStatus).not.toHaveBeenCalled()

    await waitFor(() => expect(within(region).queryByText('Draft intro')).not.toBeInTheDocument())
    expect(taskService.updateTaskStatus).toHaveBeenCalledWith(13, 'completed')
  })

  it('skips the animation for people who prefer reduced motion', async () => {
    const original = window.matchMedia
    window.matchMedia = (query) => ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} })
    try {
      setup()
      const region = await myWork()
      await userEvent.click(within(region).getByRole('checkbox', { name: 'Mark "Draft intro" done' }))
      expect(taskService.updateTaskStatus).toHaveBeenCalledWith(13, 'completed')
    } finally {
      window.matchMedia = original
    }
  })

  it('opens the new task dialog from the add row', async () => {
    setup()
    await userEvent.click(within(await myWork()).getByRole('button', { name: 'Add a task' }))
    expect(await screen.findByRole('dialog', { name: 'New task' })).toBeInTheDocument()
  })

  it('says when everything is done', async () => {
    setup({ tasks: [] })
    expect(await screen.findByText('You are all caught up')).toBeInTheDocument()
  })

  it('lists projects compactly with progress and deadline', async () => {
    setup({ projects: [project(), project({ id: 2, title: 'Chem lab', deadline: inDays(2) }), project({ id: 3, title: 'Old', status: 'archived' })] })
    const list = await screen.findByRole('region', { name: 'Projects' })
    const essayRow = within(list).getByRole('link', { name: /History essay/ })
    expect(essayRow).toHaveAttribute('href', '/projects/1')
    expect(essayRow).toHaveTextContent('2/5')
    expect(essayRow).toHaveTextContent('20 days left')
    expect(within(list).getByText('2 days left').closest('[data-urgent]')).toHaveAttribute('data-urgent', 'true')
    expect(within(list).queryByText('Old')).not.toBeInTheDocument()
  })

  it('invites you to start a project when there are none', async () => {
    setup({ projects: [], tasks: [] })
    await userEvent.click(await screen.findByRole('button', { name: 'Start a project' }))
    expect(await screen.findByRole('dialog', { name: 'New project' })).toBeInTheDocument()
  })

  it('shows an error with a retry button', async () => {
    setup({ error: { request: {} } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server')
    projectService.getProjects.mockResolvedValue({ projects: [project()] })
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('region', { name: 'Projects' })).toBeInTheDocument()
  })
})
