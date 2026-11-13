import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import FileAttachments from './FileAttachments'
import { fileService } from '../../services/fileService'
import { renderWithProviders } from '../../test/render'

vi.mock('../../services/fileService', () => ({
  fileService: { list: vi.fn(), upload: vi.fn(), download: vi.fn(), remove: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

const files = [
  { id: 1, filename: 'mine.pdf', size: 2048, uploader: { id: 1, full_name: 'Ana Lee' }, created_at: new Date().toISOString() },
  { id: 2, filename: 'theirs.png', size: 512, uploader: { id: 2, full_name: 'Sam Kim' }, created_at: new Date().toISOString() },
]

function setup({ userId = 1, ownerId = 9 } = {}) {
  fileService.list.mockResolvedValue({ files })
  fileService.upload.mockResolvedValue({ file: {} })
  fileService.remove.mockResolvedValue()
  fileService.download.mockResolvedValue()
  renderWithProviders(<FileAttachments projectId={4} taskId={7} ownerId={ownerId} />, { user: { id: userId } })
}

describe('FileAttachments', () => {
  it('lists files with their size', async () => {
    setup()
    expect(await screen.findByText('mine.pdf')).toBeInTheDocument()
    expect(screen.getByText(/2 KB/)).toBeInTheDocument()
    expect(fileService.list).toHaveBeenCalledWith(4, 7)
  })

  it('lets the uploader delete only their own file', async () => {
    setup()
    await screen.findByText('mine.pdf')
    expect(screen.getByRole('button', { name: 'Delete mine.pdf' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete theirs.png' })).not.toBeInTheDocument()
  })

  it('lets the project owner delete any file', async () => {
    setup({ userId: 9, ownerId: 9 })
    await screen.findByText('mine.pdf')
    await userEvent.click(screen.getByRole('button', { name: 'Delete theirs.png' }))
    await waitFor(() => expect(fileService.remove).toHaveBeenCalledWith(2))
  })

  it('downloads a file', async () => {
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Download mine.pdf' }))
    expect(fileService.download).toHaveBeenCalledWith(files[0])
  })

  it('uploads a chosen file', async () => {
    setup()
    const picked = new File(['%PDF-1.4'], 'report.pdf', { type: 'application/pdf' })
    await userEvent.upload(await screen.findByLabelText('Attach a file'), picked)
    await waitFor(() => expect(fileService.upload).toHaveBeenCalledWith(4, picked, 7))
  })

  it('refuses a file type we do not allow before uploading', async () => {
    setup()
    const picked = new File(['MZ'], 'setup.exe')
    await userEvent.upload(await screen.findByLabelText('Attach a file'), picked, { applyAccept: false })
    expect(fileService.upload).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/not an allowed type/))
  })
})
