import { beforeEach, describe, expect, it, vi } from 'vitest'
import api, { setUnauthorizedHandler } from './api'
import { tokens } from '../lib/tokens'

const expired = { status: 401, data: { error: { code: 'TOKEN_EXPIRED', message: 'expired' } } }

// Answers requests from a list of [url, handler] pairs instead of the network
function fakeServer(routes) {
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push({ url: config.url, auth: config.headers.Authorization })
    const handler = routes[config.url]
    const reply = handler(config, calls)
    if (reply.status >= 400) {
      const error = new Error(`Request failed with status ${reply.status}`)
      error.config = config
      error.response = { ...reply, config }
      throw error
    }
    return { data: reply.data, status: reply.status, statusText: 'OK', headers: {}, config }
  }
  return calls
}

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
    tokens.save({ access_token: 'old-access', refresh_token: 'the-refresh' })
  })

  it('refreshes an expired token once and retries the request', async () => {
    const calls = fakeServer({
      '/projects': (config) => (config.headers.Authorization === 'Bearer new-access'
        ? { status: 200, data: { projects: [] } }
        : expired),
      '/auth/refresh': () => ({ status: 200, data: { access_token: 'new-access' } }),
    })

    const response = await api.get('/projects')

    expect(response.data).toEqual({ projects: [] })
    expect(tokens.access()).toBe('new-access')
    expect(calls.find((call) => call.url === '/auth/refresh').auth).toBe('Bearer the-refresh')
  })

  it('shares one refresh between requests that expire together', async () => {
    const calls = fakeServer({
      '/a': (config) => (config.headers.Authorization === 'Bearer new-access' ? { status: 200, data: 'a' } : expired),
      '/b': (config) => (config.headers.Authorization === 'Bearer new-access' ? { status: 200, data: 'b' } : expired),
      '/auth/refresh': () => ({ status: 200, data: { access_token: 'new-access' } }),
    })

    await Promise.all([api.get('/a'), api.get('/b')])

    expect(calls.filter((call) => call.url === '/auth/refresh')).toHaveLength(1)
  })

  it('logs out when the refresh token is no good either', async () => {
    const loggedOut = vi.fn()
    setUnauthorizedHandler(loggedOut)
    fakeServer({
      '/projects': () => expired,
      '/auth/refresh': () => ({ status: 401, data: { error: { code: 'UNAUTHORIZED' } } }),
    })

    await expect(api.get('/projects')).rejects.toThrow()
    expect(loggedOut).toHaveBeenCalled()
  })

  it('does not refresh a wrong password on login', async () => {
    const calls = fakeServer({ '/auth/login': () => ({ status: 401, data: { error: { code: 'UNAUTHORIZED' } } }) })

    await expect(api.post('/auth/login', {})).rejects.toThrow()
    expect(calls.map((call) => call.url)).toEqual(['/auth/login'])
  })
})
