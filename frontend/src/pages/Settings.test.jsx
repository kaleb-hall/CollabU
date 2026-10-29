import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './Settings'
import { userService } from '../services/userService'
import { renderWithProviders } from '../test/render'

vi.mock('../services/userService', () => ({
  userService: { me: vi.fn(), updateProfile: vi.fn(), changePassword: vi.fn() },
}))

const me = { id: 1, first_name: 'Ana', last_name: 'Lee', email: 'ana@example.com', email_notifications: true }

function setup() {
  const updateUser = vi.fn()
  userService.me.mockResolvedValue({ user: me })
  userService.updateProfile.mockImplementation(async (changes) => ({ user: { ...me, ...changes } }))
  userService.changePassword.mockResolvedValue()
  renderWithProviders(<Settings />, { user: me, auth: { updateUser } })
  return { updateUser }
}

describe('Settings', () => {
  it('saves name and email preference', async () => {
    const { updateUser } = setup()
    const first = await screen.findByLabelText('First name')
    await waitFor(() => expect(first).toHaveValue('Ana'))
    await userEvent.clear(first)
    await userEvent.type(first, 'Annie')
    await userEvent.click(screen.getByLabelText('Email me about invites and tasks due soon'))
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => expect(userService.updateProfile).toHaveBeenCalledWith({
      first_name: 'Annie', last_name: 'Lee', email_notifications: false,
    }))
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'Annie' }))
  })

  it('checks that the new passwords match before sending', async () => {
    setup()
    await userEvent.type(await screen.findByLabelText('Current password'), 'Passw0rdA')
    await userEvent.type(screen.getByLabelText('New password'), 'NewPassw0rd')
    await userEvent.type(screen.getByLabelText('Type the new password again'), 'Different1')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('The new passwords do not match')).toBeInTheDocument()
    expect(userService.changePassword).not.toHaveBeenCalled()
  })

  it('changes the password and clears the form', async () => {
    setup()
    const current = await screen.findByLabelText('Current password')
    await userEvent.type(current, 'Passw0rdA')
    await userEvent.type(screen.getByLabelText('New password'), 'NewPassw0rd')
    await userEvent.type(screen.getByLabelText('Type the new password again'), 'NewPassw0rd')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    await waitFor(() => expect(userService.changePassword).toHaveBeenCalledWith('Passw0rdA', 'NewPassw0rd'))
    await waitFor(() => expect(current).toHaveValue(''))
  })

  it('shows the server message when the current password is wrong', async () => {
    setup()
    userService.changePassword.mockRejectedValue({ response: { status: 400, data: { error: {
      code: 'VALIDATION_ERROR', message: 'Some fields are invalid', details: { current_password: ['That is not your current password'] },
    } } } })
    await userEvent.type(await screen.findByLabelText('Current password'), 'nope')
    await userEvent.type(screen.getByLabelText('New password'), 'NewPassw0rd')
    await userEvent.type(screen.getByLabelText('Type the new password again'), 'NewPassw0rd')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('That is not your current password')).toBeInTheDocument()
  })
})
