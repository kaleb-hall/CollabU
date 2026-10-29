// Small per-browser preferences. Storage can be blocked (private mode), so failures are ignored.
export function readFlag(key, fallback = false) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value === 'true'
  } catch {
    return fallback
  }
}

export function writeFlag(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Not saved; the setting just resets next visit
  }
}
