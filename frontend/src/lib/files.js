// Mirrors the backend limits so people get a clear message before uploading.
// The backend still checks everything, including the file's real contents.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export const ALLOWED_EXTENSIONS = [
  'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'docx', 'xlsx', 'pptx', 'zip', 'txt', 'csv', 'md',
]

export function checkFile(file) {
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : ''
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `${file.name} is not an allowed type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`
  }
  if (file.size === 0) return `${file.name} is empty.`
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name} is too big. The limit is 10 MB.`
  return null
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}
