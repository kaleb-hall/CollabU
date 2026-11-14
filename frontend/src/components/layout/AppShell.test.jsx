import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppShell from './AppShell'
import { notificationService } from '../../services/notificationService'
import { projectService } from '../../services/projectService'
import { taskService } from '../../services/taskService'
import { renderWithProviders } from '../../test/render'

vi.mock('../../services/notificationService', () => ({
  notificationService: { unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}))
vi.mock('../../services/projectService', () => ({ projectService: { getProjects: vi.fn(), createProject: vi.fn() } }))
vi.mock('../../services/taskService', () => ({ taskService: { createTask: vi.fn() } }))

const projects = [
  { id: 1, title: 'History essay', status: 'active', task_counts: { total: 5, completed: 2 } },
  { id: 2, title: 'Chem lab', status: 'active', task_counts: { total: 3, completed: 3 } },
  { id: 3, title: 'Old thing', status: 'completed', archived_at: '2026-10-01T00:00:00Z', task_counts: { total: 1, completed: 0 } },
]

function setup() {
  notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
  projectService.getProjects.mockResolvedValue({ projects })
  taskService.createTask.mockResolvedValue({ task: { id: 9 } })
  const logout = vi.fn()
  renderWithProviders(<AppShell><p>Page content</p></AppShell>, {
    user: { id: 7, first_name: 'Bea', last_name: 'Owner', full_name: 'Bea Owner', email: 'bea@example.com' },
    route: '/dashboard',
    path: '/dashboard',
    auth: { logout },
  })
  return { logout }
}

afterEach(() => localStorage.clear())

describe('AppShell', () => {
  it('shows the page, a skip link and the main navigation', () => {
    setup()
    expect(screen.getByText('Page content')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
    const sidebar = screen.getByRole('navigation', { name: 'Sidebar' })
    expect(within(sidebar).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(within(sidebar).getByRole('link', { name: 'Calendar' })).toBeInTheDocument()
  })

  it('lists active projects in the sidebar with open task counts', async () => {
    setup()
    const sidebar = screen.getByRole('navigation', { name: 'Sidebar' })
    const essay = await within(sidebar).findByRole('link', { name: /History essay/ })
    expect(essay).toHaveAttribute('href', '/projects/1')
    expect(essay).toHaveTextContent('3')
    expect(within(sidebar).queryByText('Old thing')).not.toBeInTheDocument()
  })

  it('collapses the sidebar and remembers it', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
    expect(localStorage.getItem('collabu.sidebarCollapsed')).toBe('true')
  })

  it('searches right in the top bar and jumps to a project', async () => {
    setup()
    await screen.findAllByText('History essay')
    const search = await screen.findByRole('combobox', { name: 'Search or jump to' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await userEvent.click(search)
    expect(await screen.findByRole('listbox')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.type(search, 'chem')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Chem lab'])
    await userEvent.click(await screen.findByRole('option', { name: /Chem lab/ }))
    expect(await screen.findByText('Landed on another page')).toBeInTheDocument()
  })

  it('puts the cursor in the top bar search with Ctrl+K', async () => {
    setup()
    await userEvent.keyboard('{Control>}k{/Control}')
    await waitFor(async () => expect(await screen.findByRole('combobox', { name: 'Search or jump to' })).toHaveFocus())
    expect(await screen.findByRole('listbox')).toBeInTheDocument()
  })

  it('runs a result with the keyboard and closes with Escape', async () => {
    setup()
    await screen.findAllByText('History essay')
    const search = await screen.findByRole('combobox', { name: 'Search or jump to' })
    await userEvent.click(search)
    await userEvent.type(search, 'new task')
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('dialog', { name: 'New task' })).toBeInTheDocument()
    expect(search).toHaveValue('')

    await userEvent.keyboard('{Escape}')
    await userEvent.click(search)
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  })

  it('opens the same search from the phone navigation', async () => {
    setup()
    const phoneNav = screen.getByRole('navigation', { name: 'Phone navigation' })
    await userEvent.click(within(phoneNav).getByRole('button', { name: 'Search' }))
    await waitFor(async () => expect(await screen.findByRole('combobox', { name: 'Search or jump to' })).toHaveFocus())
    await userEvent.click(screen.getByRole('button', { name: 'Cancel search' }))
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  })

  it('creates a task from the Create menu, assigned to me', async () => {
    setup()
    await screen.findAllByText('History essay')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'New task' }))
    await userEvent.type(await screen.findByLabelText('Task'), 'Read chapter 4')
    await userEvent.clear(screen.getByLabelText('Due'))
    await userEvent.type(screen.getByLabelText('Due'), '2030-03-01')
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(taskService.createTask).toHaveBeenCalledWith(1, expect.objectContaining({
      title: 'Read chapter 4', assigned_to: 7, due_date: '2030-03-02T01:00:00.000Z',
    })))
  })

  it('opens the account menu with settings and log out', async () => {
    const { logout } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Account menu for Bea Owner' }))
    expect(await screen.findByRole('menuitem', { name: 'Settings' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }))
    expect(logout).toHaveBeenCalled()
  })
})
