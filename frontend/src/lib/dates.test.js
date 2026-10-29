import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  daysUntil,
  dueLabel,
  formatDate,
  formatDateTime,
  formatTime,
  fromInputValue,
  parseApiDate,
  toInputValue,
  userTimeZone,
} from './dates'

describe('parseApiDate', () => {
  it('reads UTC times from the API', () => {
    expect(parseApiDate('2030-01-10T17:30:00Z').toISOString()).toBe('2030-01-10T17:30:00.000Z')
  })

  it('treats a time without a zone as UTC', () => {
    expect(parseApiDate('2030-01-10T17:30:00').toISOString()).toBe('2030-01-10T17:30:00.000Z')
  })

  it('returns null for empty values', () => {
    expect(parseApiDate(null)).toBeNull()
    expect(parseApiDate('')).toBeNull()
  })
})

describe('datetime-local inputs', () => {
  it('turns an input value (local time) into a UTC ISO string', () => {
    // 9:30 in Los Angeles in January is 17:30 UTC
    expect(fromInputValue('2030-01-10T09:30')).toBe('2030-01-10T17:30:00.000Z')
  })

  it('turns an API time into a local input value', () => {
    expect(toInputValue('2030-01-10T17:30:00Z')).toBe('2030-01-10T09:30')
  })

  it('round trips', () => {
    expect(toInputValue(fromInputValue('2030-07-04T18:05'))).toBe('2030-07-04T18:05')
  })

  it('returns empty for empty values', () => {
    expect(fromInputValue('')).toBeNull()
    expect(toInputValue(null)).toBe('')
  })
})

describe('formatting in local time', () => {
  it('formats dates and times', () => {
    expect(formatDate('2030-01-10T17:30:00Z')).toBe('Jan 10, 2030')
    expect(formatTime('2030-01-10T17:30:00Z')).toBe('9:30 AM')
    expect(formatDateTime('2030-01-10T17:30:00Z')).toBe('Jan 10, 9:30 AM')
  })

  it('uses the local date, not the UTC date', () => {
    // 03:00 UTC on Jan 11 is still Jan 10 in Los Angeles
    expect(formatDate('2030-01-11T03:00:00Z')).toBe('Jan 10, 2030')
  })
})

describe('relative labels', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-10T18:00:00Z')) // 10:00 Jan 10 in Los Angeles
  })
  afterEach(() => vi.useRealTimers())

  it('labels today and tomorrow', () => {
    expect(dueLabel('2030-01-11T01:00:00Z')).toBe('Today, 5:00 PM')
    expect(dueLabel('2030-01-11T17:00:00Z')).toBe('Tomorrow, 9:00 AM')
    expect(dueLabel('2030-01-20T17:00:00Z')).toBe('Jan 20')
  })

  it('counts calendar days until a date', () => {
    expect(daysUntil('2030-01-11T07:00:00Z')).toBe(0) // 23:00 Jan 10 local
    expect(daysUntil('2030-01-12T17:00:00Z')).toBe(2)
    expect(daysUntil('2030-01-09T17:00:00Z')).toBe(-1)
  })
})

it('reports the browser timezone', () => {
  expect(userTimeZone()).toBe('America/Los_Angeles')
})
