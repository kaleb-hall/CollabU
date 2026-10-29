import { describe, expect, it } from 'vitest'
import { normalizeRange, weekRange } from './calendarRange'

describe('calendar ranges', () => {
  it('starts with the current week, Sunday to the next Sunday, in local time', () => {
    const { start, end } = weekRange(new Date('2030-01-09T20:00:00Z'))
    expect(start.toISOString()).toBe('2030-01-06T08:00:00.000Z')
    expect(end.toISOString()).toBe('2030-01-13T08:00:00.000Z')
  })

  it('reads the list of days the week and day views report', () => {
    const days = [new Date(2030, 0, 6), new Date(2030, 0, 7), new Date(2030, 0, 12)]
    const { start, end } = normalizeRange(days)
    expect(start).toEqual(new Date(2030, 0, 6))
    expect(end).toEqual(new Date(2030, 0, 13))
  })

  it('reads the start and end the month and agenda views report', () => {
    const { start, end } = normalizeRange({ start: new Date(2029, 11, 30), end: new Date(2030, 1, 9) })
    expect(start).toEqual(new Date(2029, 11, 30))
    expect(end).toEqual(new Date(2030, 1, 10))
  })
})
