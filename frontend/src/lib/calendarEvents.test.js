import { describe, expect, it } from 'vitest'
import { toCalendarEvents } from './calendarEvents'

const task = (extra) => ({ id: 1, title: 'Outline', project_id: 3, status: 'todo', due_date: '2030-01-10T17:00:00Z', start_date: null, estimated_hours: null, ...extra })
const block = { id: 7, title: 'CS 101', block_type: 'class', start_time: '2030-01-08T18:00:00Z', end_time: '2030-01-08T19:30:00Z', is_recurring: true }

describe('toCalendarEvents', () => {
  it('places a scheduled task from its start for its estimated hours', () => {
    const [event] = toCalendarEvents([task({ start_date: '2030-01-09T17:00:00Z', estimated_hours: 3 })], [])
    expect(event.start.toISOString()).toBe('2030-01-09T17:00:00.000Z')
    expect(event.end.toISOString()).toBe('2030-01-09T20:00:00.000Z')
    expect(event.kind).toBe('task')
  })

  it('shows an unscheduled task as the two hours before it is due', () => {
    const [event] = toCalendarEvents([task()], [])
    expect(event.start.toISOString()).toBe('2030-01-10T15:00:00.000Z')
    expect(event.end.toISOString()).toBe('2030-01-10T17:00:00.000Z')
  })

  it('leaves completed tasks off the calendar', () => {
    expect(toCalendarEvents([task({ status: 'completed' })], [])).toEqual([])
  })

  it('turns each busy block occurrence into an event with a unique id', () => {
    const second = { ...block, start_time: '2030-01-15T18:00:00Z', end_time: '2030-01-15T19:30:00Z' }
    const events = toCalendarEvents([], [block, second])
    expect(events.map((e) => e.kind)).toEqual(['block', 'block'])
    expect(new Set(events.map((e) => e.id)).size).toBe(2)
    expect(events[0].title).toBe('CS 101')
  })
})
