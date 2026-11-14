import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import Login from './Login'
import { clearPendingInvite, savePendingInvite } from '../lib/pendingInvite'
import { renderWithProviders } from '../test/render'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

function open(login = vi.fn().mockResolvedValue({})) {
  renderWithProviders(<Login />, { route: '/login', path: '/login', auth: { login } })
  return login
}

describe('Login', () => {
  afterEach(() => clearPendingInvite())

  it('logs in and goes home', async () => {
    const login = open()
    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Passw0rdA')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'Passw0rdA' })
    expect(await screen.findByText('Landed on another page')).toBeInTheDocument()
  })

  it('shows the server message when it fails', async () => {
    open(vi.fn().mockRejectedValue({ response: { status: 401, data: { error: { code: 'UNAUTHORIZED', message: 'Wrong email or password' } } } }))
    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Wrong email or password'))
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
  })

  it('fills in the invited email and links to register', () => {
    savePendingInvite({ token: 'tok', email: 'sam@example.com' })
    open()
    expect(screen.getByLabelText('Email')).toHaveValue('sam@example.com')
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register')
  })
})
