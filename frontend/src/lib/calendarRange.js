// The calendar only asks the API for what it is showing.
import { addDays, addWeeks, startOfDay, startOfWeek } from 'date-fns'

export function weekRange(date) {
  const start = startOfWeek(date)
  return { start, end: addWeeks(start, 1) }
}

// react-big-calendar reports a list of days (week, day) or { start, end } (month, agenda).
// The end becomes the start of the day after the last visible day.
export function normalizeRange(range) {
  if (Array.isArray(range)) {
    return { start: startOfDay(range[0]), end: addDays(startOfDay(range[range.length - 1]), 1) }
  }
  return { start: startOfDay(range.start), end: addDays(startOfDay(range.end), 1) }
}
