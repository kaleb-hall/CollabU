import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskComments from './TaskComments'
import { commentService } from '../../services/commentService'
import { renderWithProviders } from '../../test/render'

vi.mock('../../services/commentService', () => ({
  commentService: { list: vi.fn(), add: vi.fn(), remove: vi.fn() },
}))

const comments = [
  { id: 1, body: 'Started the outline', created_at: new Date().toISOString(), author: { id: 1, full_name: 'Ana Lee' } },
  { id: 2, body: 'Nice, I can review', created_at: new Date().toISOString(), author: { id: 2, full_name: 'Sam Kim' } },
]

function setup() {
  commentService.list.mockResolvedValue({ comments })
  commentService.add.mockResolvedValue({ comment: {} })
  commentService.remove.mockResolvedValue()
  renderWithProviders(<TaskComments taskId={9} projectId={3} />, { user: { id: 1 } })
}

describe('TaskComments', () => {
  it('lists comments oldest first', async () => {
    setup()
    const items = await screen.findAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Started the outline')
    expect(items[1]).toHaveTextContent('Nice, I can review')
  })

  it('only lets me delete my own comment', async () => {
    setup()
    await screen.findByText('Started the outline')
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete comment' })
    expect(deleteButtons).toHaveLength(1)
    await userEvent.click(deleteButtons[0])
    await waitFor(() => expect(commentService.remove).toHaveBeenCalledWith(9, 1))
  })

  it('adds a comment and clears the box', async () => {
    setup()
    const box = await screen.findByLabelText('Add a comment')
    await userEvent.type(box, 'Done with intro')
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    await waitFor(() => expect(commentService.add).toHaveBeenCalledWith(9, 'Done with intro'))
    await waitFor(() => expect(box).toHaveValue(''))
  })

  it('does not post an empty comment', async () => {
    setup()
    await screen.findByText('Started the outline')
    expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled()
  })
})
