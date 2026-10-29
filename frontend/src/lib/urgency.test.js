import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deadlineLabel, dueStamp, isUrgent } from './urgency'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2030-01-10T18:00:00Z')) // 10:00 Jan 10 in Los Angeles
})
afterEach(() => vi.useRealTimers())

describe('deadlineLabel', () => {
  it('counts calendar days in plain words', () => {
    expect(deadlineLabel('2030-01-11T01:00:00Z')).toBe('Due today')
    expect(deadlineLabel('2030-01-11T18:00:00Z')).toBe('Due tomorrow')
    expect(deadlineLabel('2030-01-15T18:00:00Z')).toBe('5 days left')
    expect(deadlineLabel('2030-01-09T18:00:00Z')).toBe('1 day late')
    expect(deadlineLabel('2030-01-07T18:00:00Z')).toBe('3 days late')
  })
})

describe('isUrgent', () => {
  it('is true for late, today, and within the warning window', () => {
    expect(isUrgent('2030-01-07T18:00:00Z')).toBe(true)
    expect(isUrgent('2030-01-11T01:00:00Z')).toBe(true)
    expect(isUrgent('2030-01-13T18:00:00Z', 3)).toBe(true)
    expect(isUrgent('2030-01-14T18:00:00Z', 3)).toBe(false)
    expect(isUrgent('2030-01-11T18:00:00Z')).toBe(false)
  })
})

describe('dueStamp', () => {
  it('is a short stamp for the date column', () => {
    expect(dueStamp('2030-01-11T01:00:00Z')).toBe('TODAY')
    expect(dueStamp('2030-01-11T18:00:00Z')).toBe('TOMORROW')
    expect(dueStamp('2030-01-20T18:00:00Z')).toBe('JAN 20')
    expect(dueStamp('2030-01-08T18:00:00Z')).toBe('LATE')
  })
})
