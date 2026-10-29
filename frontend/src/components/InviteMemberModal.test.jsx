import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InviteMemberModal from './InviteMemberModal'
import { inviteService } from '../services/inviteService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/inviteService', () => ({
  inviteService: { listForProject: vi.fn(), create: vi.fn(), cancel: vi.fn() },
}))

function setup() {
  inviteService.listForProject.mockResolvedValue({ invites: [{ id: 7, email: 'lee@example.com', role: 'member', status: 'pending' }] })
  inviteService.create.mockResolvedValue({ invite: { id: 8 } })
  inviteService.cancel.mockResolvedValue()
  renderWithProviders(<InviteMemberModal projectId={4} onClose={() => {}} />)
}

describe('InviteMemberModal', () => {
  it('sends an invite by email', async () => {
    setup()
    await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }))
    await waitFor(() => expect(inviteService.create).toHaveBeenCalledWith(4, { email: 'sam@example.com', role: 'member' }))
    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveValue(''))
  })

  it('lists pending invites and cancels one', async () => {
    setup()
    expect(await screen.findByText('lee@example.com')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel invite for lee@example.com' }))
    await waitFor(() => expect(inviteService.cancel).toHaveBeenCalledWith(4, 7))
  })
})
