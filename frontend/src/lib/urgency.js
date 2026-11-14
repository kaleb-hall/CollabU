// How close a date is, in words. This decides when the tomato accent appears,
// so it stays rare: only for late work, things due today, or deadlines in the warning window.
import { format } from 'date-fns'
import { daysUntil, parseApiDate } from './dates'

export function deadlineLabel(value) {
  const days = daysUntil(value)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days > 1) return `${days} days left`
  return `${-days} day${days === -1 ? '' : 's'} late`
}

// Tasks: urgent when late or due today. Projects pass a window (for example 3 days).
export function isUrgent(value, windowDays = 0) {
  return daysUntil(value) <= windowDays
}

export function dueStamp(value) {
  const days = daysUntil(value)
  if (days < 0) return 'LATE'
  if (days === 0) return 'TODAY'
  if (days === 1) return 'TOMORROW'
  return format(parseApiDate(value), 'MMM d').toUpperCase()
}

// The due column in My work: how late, the time today, the weekday this week, or the date
export function workDueLabel(value) {
  const days = daysUntil(value)
  const date = parseApiDate(value)
  if (days < 0) return `${-days}d late`
  if (days === 0) return format(date, 'h:mm a')
  if (days <= 7) return format(date, 'EEE d')
  return format(date, 'MMM d')
}
