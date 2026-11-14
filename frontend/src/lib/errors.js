// Turns any failed request into a sentence we can show the user.
// API errors look like { error: { code, message, details } }.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const apiError = error?.response?.data?.error
  if (apiError) {
    const firstField = Object.values(apiError.details || {}).flat()[0]
    if (apiError.code === 'VALIDATION_ERROR' && typeof firstField === 'string') return firstField
    return apiError.message || fallback
  }
  if (error?.request && !error?.response) {
    return 'Could not reach the server. Check your connection and try again.'
  }
  return fallback
}
