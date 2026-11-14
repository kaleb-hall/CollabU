import { describe, expect, it } from 'vitest'
import { checkFile, formatSize, MAX_UPLOAD_BYTES } from './files'

const file = (name, size) => ({ name, size })

describe('checkFile', () => {
  it('accepts allowed files under the limit', () => {
    expect(checkFile(file('notes.PDF', 1000))).toBeNull()
    expect(checkFile(file('slides.pptx', MAX_UPLOAD_BYTES))).toBeNull()
  })

  it('rejects files that are too big', () => {
    expect(checkFile(file('video.zip', MAX_UPLOAD_BYTES + 1))).toBe('video.zip is too big. The limit is 10 MB.')
  })

  it('rejects types we do not allow', () => {
    expect(checkFile(file('setup.exe', 10))).toMatch(/setup.exe is not an allowed type/)
    expect(checkFile(file('README', 10))).toMatch(/not an allowed type/)
  })

  it('rejects empty files', () => {
    expect(checkFile(file('notes.txt', 0))).toBe('notes.txt is empty.')
  })
})

describe('formatSize', () => {
  it('uses readable units', () => {
    expect(formatSize(512)).toBe('512 B')
    expect(formatSize(2048)).toBe('2 KB')
    expect(formatSize(5.5 * 1024 * 1024)).toBe('5.5 MB')
  })
})
