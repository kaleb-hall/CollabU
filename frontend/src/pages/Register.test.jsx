import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from './Register'
import { clearPendingInvite, savePendingInvite } from '../lib/pendingInvite'
import { renderWithProviders } from '../test/render'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

describe('Register', () => {
  afterEach(() => clearPendingInvite())

  it('creates an account', async () => {
    const register = vi.fn().mockResolvedValue({})
    renderWithProviders(<Register />, { route: '/register', path: '/register', auth: { register } })
    expect(screen.getByRole('heading', { level: 1, name: 'Create your account' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('First name'), 'Sam')
    await userEvent.type(screen.getByLabelText('Last name'), 'Kim')
    await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Passw0rdS')
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(register).toHaveBeenCalledWith({ first_name: 'Sam', last_name: 'Kim', email: 'sam@example.com', password: 'Passw0rdS' })
    expect(await screen.findByText('Landed on another page')).toBeInTheDocument()
  })

  it('fills in the invited email', () => {
    savePendingInvite({ token: 'tok', email: 'sam@example.com' })
    renderWithProviders(<Register />, { route: '/register', path: '/register' })
    expect(screen.getByLabelText('Email')).toHaveValue('sam@example.com')
  })
})
