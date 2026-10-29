// Remembers an invite link while someone logs in or creates an account,
// so they land back on the invite afterwards. Lives only for this browser tab.
const KEY = 'collabu.pendingInvite'

export function savePendingInvite(invite) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(invite))
  } catch {
    // Storage can be blocked (private mode); the user can reopen the email link.
  }
}

export function getPendingInvite() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export function clearPendingInvite() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nothing to clear
  }
}
