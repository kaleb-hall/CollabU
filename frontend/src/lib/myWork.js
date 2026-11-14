// Groups my open tasks the way planners do: what is late, what is today, the next week, and later.
import { daysUntil, parseApiDate } from './dates'

const GROUPS = [
  { key: 'late', label: 'Late', test: (days) => days < 0 },
  { key: 'today', label: 'Today', test: (days) => days === 0 },
  { key: 'week', label: 'Next 7 days', test: (days) => days >= 1 && days <= 7 },
  { key: 'later', label: 'Later', test: (days) => days > 7 },
]

export function groupMyWork(tasks) {
  const open = tasks
    .filter((task) => task.status !== 'completed')
    .sort((a, b) => parseApiDate(a.due_date) - parseApiDate(b.due_date))
  return GROUPS
    .map(({ key, label, test }) => ({ key, label, tasks: open.filter((task) => test(daysUntil(task.due_date))) }))
    .filter((group) => group.tasks.length > 0)
}
