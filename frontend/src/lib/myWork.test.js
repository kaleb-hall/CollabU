import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { groupMyWork } from './myWork'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2030-01-10T18:00:00Z')) // Thu 10:00 Jan 10 in Los Angeles
})
afterEach(() => vi.useRealTimers())

const task = (id, due, status = 'todo') => ({ id, due_date: due, status })

describe('groupMyWork', () => {
  it('puts open tasks into late, today, this week and later, in date order', () => {
    const groups = groupMyWork([
      task(1, '2030-01-25T18:00:00Z'),
      task(2, '2030-01-09T18:00:00Z'),
      task(3, '2030-01-11T01:00:00Z'),
      task(4, '2030-01-12T18:00:00Z'),
      task(5, '2030-01-17T18:00:00Z'),
      task(6, '2030-01-10T20:00:00Z', 'completed'),
    ])
    expect(groups.map((g) => [g.key, g.tasks.map((t) => t.id)])).toEqual([
      ['late', [2]],
      ['today', [3]],
      ['week', [4, 5]],
      ['later', [1]],
    ])
    expect(groups.map((g) => g.label)).toEqual(['Late', 'Today', 'Next 7 days', 'Later'])
  })

  it('leaves out empty groups', () => {
    expect(groupMyWork([task(1, '2030-01-11T01:00:00Z')]).map((g) => g.key)).toEqual(['today'])
    expect(groupMyWork([])).toEqual([])
  })
})
