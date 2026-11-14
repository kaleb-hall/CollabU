import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InviteAccept from './InviteAccept'
import { inviteService } from '../services/inviteService'
import { clearPendingInvite, getPendingInvite } from '../lib/pendingInvite'
import { renderWithProviders } from '../test/render'

vi.mock('../services/inviteService', () => ({ inviteService: { get: vi.fn(), accept: vi.fn() } }))

const invite = {
  project_title: 'Essay', inviter_name: 'Ana Lee', email: 'sam@example.com', role: 'member', status: 'pending', has_account: false,
}

function open(user, details = invite) {
  inviteService.get.mockResolvedValue({ invite: details })
  return renderWithProviders(<InviteAccept />, { user, route: '/invite/tok123', path: '/invite/:token' })
}

describe('InviteAccept', () => {
  afterEach(() => clearPendingInvite())

  it('sends new people to create an account and remembers the invite', async () => {
    open(null)
    expect(await screen.findByText(/Ana Lee invited you to/)).toHaveTextContent('Essay')
    await userEvent.click(screen.getByRole('link', { name: 'Create an account' }))
    expect(getPendingInvite()).toEqual({ token: 'tok123', email: 'sam@example.com' })
    expect(await screen.findByText('Landed on another page')).toBeInTheDocument()
  })

  it('offers log in first when the email already has an account', async () => {
    open(null, { ...invite, has_account: true })
    expect(await screen.findByRole('link', { name: 'Log in to accept' })).toBeInTheDocument()
  })

  it('joins and opens the project when logged in', async () => {
    inviteService.accept.mockResolvedValue({ project_id: 5 })
    open({ id: 2, email: 'sam@example.com' })
    await userEvent.click(await screen.findByRole('button', { name: 'Join Essay' }))
    expect(inviteService.accept).toHaveBeenCalledWith('tok123')
    expect(await screen.findByText('Landed on another page')).toBeInTheDocument()
  })

  it('explains when the logged in account has a different email', async () => {
    open({ id: 3, email: 'lee@example.com' })
    expect(await screen.findByText(/This invite was sent to sam@example.com/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Join Essay' })).not.toBeInTheDocument()
  })

  it('shows expired invites clearly', async () => {
    open(null, { ...invite, status: 'expired' })
    expect(await screen.findByText(/This invite has expired/)).toBeInTheDocument()
  })

  it('shows a broken link clearly', async () => {
    inviteService.get.mockRejectedValue({ response: { status: 404, data: { error: { code: 'NOT_FOUND', message: 'This invite link is not valid.' } } } })
    renderWithProviders(<InviteAccept />, { route: '/invite/bad', path: '/invite/:token' })
    expect(await screen.findByText('This invite link is not valid.')).toBeInTheDocument()
  })
})
