// Turns my open tasks and my busy time into events for the calendar view.
import { addHours, subHours } from 'date-fns'
import { parseApiDate } from './dates'

const UNSCHEDULED_HOURS = 2

function taskEvent(task) {
  const due = parseApiDate(task.due_date)
  // Planned tasks run from their start for their estimate; others show as the hours before they are due
  const start = task.start_date ? parseApiDate(task.start_date) : subHours(due, UNSCHEDULED_HOURS)
  const end = task.start_date ? addHours(start, task.estimated_hours || UNSCHEDULED_HOURS) : due
  return { id: `task-${task.id}`, kind: 'task', title: task.title, start, end, data: task }
}

function blockEvent(block) {
  return {
    id: `block-${block.id}-${block.start_time}`,
    kind: 'block',
    title: block.title,
    start: parseApiDate(block.start_time),
    end: parseApiDate(block.end_time),
    data: block,
  }
}

export function toCalendarEvents(tasks, blocks) {
  return [
    ...tasks.filter((task) => task.status !== 'completed').map(taskEvent),
    ...blocks.map(blockEvent),
  ]
}
