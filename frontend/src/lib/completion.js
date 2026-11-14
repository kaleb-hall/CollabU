// Who may finish a project, and how long it took. The backend checks the same rule.
import { parseApiDate } from './dates'

const DAY_MS = 24 * 60 * 60 * 1000

// Archived projects leave the sidebar and Home, but stay in search
export function isArchived(project) {
  return Boolean(project.archived_at)
}

export function allTasksDone(tasks) {
  return tasks.length > 0 && tasks.every((task) => task.status === 'completed')
}

// The creator can finish at any time; everyone else once every task is done
export function canComplete(project, tasks, userId) {
  if (project.status === 'completed') return false
  return userId === project.created_by || allTasksDone(tasks)
}

export function timeTaken(start, end) {
  const days = Math.round((parseApiDate(end) - parseApiDate(start)) / DAY_MS)
  if (days < 1) return 'Less than a day'
  return days === 1 ? '1 day' : `${days} days`
}
