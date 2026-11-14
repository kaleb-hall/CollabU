import { describe, expect, it } from 'vitest'
import { canComplete, timeTaken } from './completion'

const project = { created_by: 1, status: 'active' }
const open = [{ status: 'completed' }, { status: 'todo' }]
const done = [{ status: 'completed' }, { status: 'completed' }]

describe('canComplete', () => {
  it('lets the creator finish at any time', () => {
    expect(canComplete(project, open, 1)).toBe(true)
  })

  it('lets everyone else finish once every task is done', () => {
    expect(canComplete(project, open, 2)).toBe(false)
    expect(canComplete(project, done, 2)).toBe(true)
  })

  it('needs at least one task for anyone but the creator', () => {
    expect(canComplete(project, [], 2)).toBe(false)
  })

  it('is false once the project is completed', () => {
    expect(canComplete({ ...project, status: 'completed' }, done, 1)).toBe(false)
  })
})

describe('timeTaken', () => {
  it('counts days', () => {
    expect(timeTaken('2026-11-01T10:00:00Z', '2026-11-13T09:00:00Z')).toBe('12 days')
  })

  it('says one day and less than a day', () => {
    expect(timeTaken('2026-11-01T10:00:00Z', '2026-11-02T11:00:00Z')).toBe('1 day')
    expect(timeTaken('2026-11-01T10:00:00Z', '2026-11-01T15:00:00Z')).toBe('Less than a day')
  })
})
