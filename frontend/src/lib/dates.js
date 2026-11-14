// The API always sends and receives UTC ISO strings. Everything shown to the
// user is in their local time. All date handling in the app goes through here.
import { differenceInCalendarDays, format, formatDistanceToNowStrict, isToday, isTomorrow } from 'date-fns'

const HAS_ZONE = /(Z|[+-]\d\d:?\d\d)$/

export function parseApiDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  return new Date(HAS_ZONE.test(value) ? value : `${value}Z`)
}

export function toApiDate(date) {
  return date ? date.toISOString() : null
}

// <input type="datetime-local"> values are local times like "2030-01-10T09:30"
export function fromInputValue(value) {
  return value ? new Date(value).toISOString() : null
}

export function toInputValue(value) {
  const date = parseApiDate(value)
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : ''
}

export function formatDate(value) {
  return format(parseApiDate(value), 'MMM d, yyyy')
}

export function formatShortDate(value) {
  return format(parseApiDate(value), 'MMM d')
}

export function formatTime(value) {
  return format(parseApiDate(value), 'h:mm a')
}

export function formatDateTime(value) {
  return format(parseApiDate(value), 'MMM d, h:mm a')
}

export function dueLabel(value) {
  const date = parseApiDate(value)
  if (isToday(date)) return `Today, ${formatTime(date)}`
  if (isTomorrow(date)) return `Tomorrow, ${formatTime(date)}`
  return formatShortDate(date)
}

export function daysUntil(value) {
  return differenceInCalendarDays(parseApiDate(value), new Date())
}

export function userTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function timeAgo(value) {
  const date = parseApiDate(value)
  if (Date.now() - date.getTime() < 60_000) return 'just now'
  return formatDistanceToNowStrict(date, { addSuffix: true })
}
