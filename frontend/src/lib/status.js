// Task statuses in board order, with the words people see and the token color for each.
export const STATUSES = [
  { value: 'todo', label: 'To do', color: 'var(--status-todo)' },
  { value: 'in_progress', label: 'In progress', color: 'var(--status-progress)' },
  { value: 'review', label: 'In review', color: 'var(--status-review)' },
  { value: 'blocked', label: 'Blocked', color: 'var(--status-blocked)' },
  { value: 'completed', label: 'Done', color: 'var(--status-done)' },
]

export const statusInfo = (value) => STATUSES.find((status) => status.value === value) ?? STATUSES[0]
