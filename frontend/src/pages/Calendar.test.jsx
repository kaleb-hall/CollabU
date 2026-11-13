import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calendar from './Calendar'
import { calendarService } from '../services/calendarService'
import { taskService } from '../services/taskService'
import { projectService } from '../services/projectService'
import { notificationService } from '../services/notificationService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/calendarService', () => ({
  calendarService: { getCalendarBlocks: vi.fn(), createCalendarBlock: vi.fn(), deleteCalendarBlock: vi.fn() },
}))
vi.mock('../services/taskService', () => ({ taskService: { getMyTasks: vi.fn() } }))
vi.mock('../services/projectService', () => ({ projectService: { getProjects: vi.fn() } }))
vi.mock('../services/notificationService', () => ({
  notificationService: { unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

function todayAt(hour) {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const block = {
  id: 7, title: 'CS 101 lecture', description: null, block_type: 'class', start_time: todayAt(10), end_time: todayAt(11),
  is_recurring: true, repeat_days: ['MO', 'WE'], repeat_until: '2031-05-01',
}

function setup() {
  notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
  calendarService.getCalendarBlocks.mockResolvedValue({ blocks: [block] })
  calendarService.createCalendarBlock.mockResolvedValue({ block: {}, warnings: [] })
  calendarService.deleteCalendarBlock.mockResolvedValue()
  taskService.getMyTasks.mockResolvedValue({ tasks: [] })
  projectService.getProjects.mockResolvedValue({ projects: [] })
  renderWithProviders(<Calendar />, { user: { id: 1, first_name: 'Bea', last_name: 'Owner', email: 'b@x.com' }, route: '/calendar', path: '/calendar' })
}

describe('Calendar', () => {
  it('shows the week with its own toolbar', async () => {
    setup()
    expect(await screen.findByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText('CS 101 lecture')).toBeInTheDocument()
  })

  it('adds repeating busy time', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Add busy time' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add busy time' })
    await userEvent.type(within(dialog).getByLabelText('What is it?'), 'Shift at the library')
    await userEvent.click(within(dialog).getByLabelText('Repeats every week'))
    await userEvent.type(within(dialog).getByLabelText('Until'), '2031-01-31')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add busy time' }))
    await waitFor(() => expect(calendarService.createCalendarBlock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Shift at the library', repeat_until: '2031-01-31',
    })))
    expect(calendarService.createCalendarBlock.mock.calls[0][0].repeat_days).toHaveLength(1)
  })

  it('shows details for busy time and deletes every repeat after confirming', async () => {
    setup()
    await userEvent.click(await screen.findByText('CS 101 lecture'))
    const dialog = await screen.findByRole('dialog', { name: 'CS 101 lecture' })
    expect(within(dialog).getByText(/Every Mon and Wed until May 1, 2031/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete every repeat' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(calendarService.deleteCalendarBlock).toHaveBeenCalledWith(7))
  })
})
