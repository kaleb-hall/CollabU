import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppShell from './AppShell'
import { notificationService } from '../../services/notificationService'
import { renderWithProviders } from '../../test/render'

vi.mock('../../services/notificationService', () => ({
  notificationService: { unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}))

function setup() {
  notificationService.unreadCount.mockResolvedValue({ unread_count: 0 })
  const logout = vi.fn()
  renderWithProviders(<AppShell><p>Page content</p></AppShell>, {
    user: { id: 1, first_name: 'Bea', last_name: 'Owner', full_name: 'Bea Owner', email: 'bea@example.com' },
    route: '/dashboard',
    path: '/dashboard',
    auth: { logout },
  })
  return { logout }
}

describe('AppShell', () => {
  it('shows the page with navigation', () => {
    setup()
    expect(screen.getByText('Page content')).toBeInTheDocument()
    const dashboardLinks = screen.getAllByRole('link', { name: 'Dashboard' })
    expect(dashboardLinks[0]).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('link', { name: 'Calendar' }).length).toBeGreaterThan(0)
  })

  it('has a skip link to the main content', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  it('opens the account menu with settings and log out', async () => {
    const { logout } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Account menu for Bea Owner' }))
    expect(await screen.findByRole('menuitem', { name: 'Settings' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }))
    expect(logout).toHaveBeenCalled()
  })
})
