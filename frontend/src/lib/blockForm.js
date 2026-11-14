// Turns the busy-time form into what the API expects, and describes repeats.
import { format, parseISO } from 'date-fns'
import { fromInputValue } from './dates'

export const WEEKDAYS = [
  { code: 'MO', label: 'Mon' },
  { code: 'TU', label: 'Tue' },
  { code: 'WE', label: 'Wed' },
  { code: 'TH', label: 'Thu' },
  { code: 'FR', label: 'Fri' },
  { code: 'SA', label: 'Sat' },
  { code: 'SU', label: 'Sun' },
]

const ORDER = WEEKDAYS.map((day) => day.code)

// Local weekday of a datetime-local value such as "2030-01-07T09:00"
export function weekdayCode(inputValue) {
  return ORDER[(new Date(inputValue).getDay() + 6) % 7]
}

export function buildBlockPayload(form) {
  const repeating = form.repeats && form.repeat_days.length > 0
  return {
    title: form.title,
    description: form.description,
    block_type: form.block_type,
    start_time: fromInputValue(form.start_time),
    end_time: fromInputValue(form.end_time),
    repeat_days: repeating ? [...form.repeat_days].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)) : null,
    repeat_until: repeating ? form.repeat_until : null,
  }
}

function joinWords(words) {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

export function describeRepeat(block) {
  if (!block.repeat_days?.length) return null
  const days = block.repeat_days.map((code) => WEEKDAYS.find((day) => day.code === code).label)
  return `Every ${joinWords(days)} until ${format(parseISO(block.repeat_until), 'MMM d, yyyy')}`
}
