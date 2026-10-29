import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationBell from './NotificationBell'
import { notificationService } from '../services/notificationService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/notificationService', () => ({
  notificationService: { unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}))

const notifications = [
  { id: 2, title: 'You were assigned "Outline"', message: 'Essay', link: '/projects/4', read: false, created_at: new Date().toISOString() },
  { id: 1, title: 'Sam joined Essay', message: null, link: '/projects/4', read: true, created_at: new Date().toISOString() },
]

function setup() {
  notificationService.unreadCount.mockResolvedValue({ unread_count: 1 })
  notificationService.list.mockResolvedValue({ notifications, next_cursor: null, unread_count: 1 })
  notificationService.markRead.mockResolvedValue({})
  notificationService.markAllRead.mockResolvedValue({ unread_count: 0 })
  return renderWithProviders(<NotificationBell />, { user: { id: 1 }, route: '/dashboard', path: '/dashboard' })
}

describe('NotificationBell', () => {
  it('shows the unread count', async () => {
    setup()
    expect(await screen.findByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument()
  })

  it('opens a list and marks everything read', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: /Notifications/ }))
    expect(await screen.findByText('You were assigned "Outline"')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mark all read' }))
    await waitFor(() => expect(notificationService.markAllRead).toHaveBeenCalled())
  })

  it('marks one read and follows its link', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: /Notifications/ }))
    await userEvent.click(await screen.findByText('You were assigned "Outline"'))
    expect(notificationService.markRead).toHaveBeenCalledWith(2)
    expect(await screen.findByText('Landed on another page')).toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: /Notifications/ }))
    await screen.findByText('Sam joined Essay')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByText('Sam joined Essay')).not.toBeInTheDocument()
  })
})
