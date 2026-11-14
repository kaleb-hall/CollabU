import { describe, expect, it } from 'vitest'
import { createQueryClient, shouldRetry } from './queryClient'

describe('query client defaults', () => {
  it('keeps data fresh for 30 seconds', () => {
    expect(createQueryClient().getDefaultOptions().queries.staleTime).toBe(30_000)
  })

  it('does not retry errors the server meant (4xx)', () => {
    expect(shouldRetry(0, { response: { status: 404 } })).toBe(false)
    expect(shouldRetry(0, { response: { status: 403 } })).toBe(false)
  })

  it('retries a server or network error once', () => {
    expect(shouldRetry(0, { response: { status: 500 } })).toBe(true)
    expect(shouldRetry(0, { request: {} })).toBe(true)
    expect(shouldRetry(1, { response: { status: 500 } })).toBe(false)
  })
})
