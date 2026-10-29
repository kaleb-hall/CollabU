import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

const apiError = (error, status = 400) => ({ response: { status, data: { error } } })

describe('getErrorMessage', () => {
  it('reads the message from the API error format', () => {
    expect(getErrorMessage(apiError({ code: 'NOT_FOUND', message: 'Task not found', details: {} }))).toBe('Task not found')
  })

  it('shows field errors for validation errors', () => {
    const error = apiError({
      code: 'VALIDATION_ERROR',
      message: 'Some fields are invalid',
      details: { password: ['Password must contain at least one number'] },
    })
    expect(getErrorMessage(error)).toBe('Password must contain at least one number')
  })

  it('explains network errors', () => {
    expect(getErrorMessage({ request: {}, message: 'Network Error' })).toBe('Could not reach the server. Check your connection and try again.')
  })

  it('falls back to the given message', () => {
    expect(getErrorMessage(new Error('boom'), 'Could not save')).toBe('Could not save')
  })
})
