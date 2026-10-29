import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '../lib/queryClient'
import { queryKeys } from './queryKeys'
import { useMoveTask } from './useTasks'
import { taskService } from '../services/taskService'

vi.mock('../services/taskService', () => ({ taskService: { updateTaskStatus: vi.fn() } }))

function setup() {
  const queryClient = createQueryClient()
  queryClient.setQueryData(queryKeys.projectTasks(7), {
    tasks: [{ id: 1, status: 'todo' }, { id: 2, status: 'todo' }],
  })
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  const { result } = renderHook(() => useMoveTask(7), { wrapper })
  const statusOf = (id) => queryClient.getQueryData(queryKeys.projectTasks(7)).tasks.find((t) => t.id === id).status
  return { result, statusOf }
}

describe('useMoveTask', () => {
  it('moves the card before the server answers', async () => {
    let finish
    taskService.updateTaskStatus.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const { result, statusOf } = setup()

    act(() => result.current.mutate({ taskId: 1, status: 'review' }))
    await waitFor(() => expect(statusOf(1)).toBe('review'))
    expect(statusOf(2)).toBe('todo')

    await act(async () => finish({ task: { id: 1, status: 'review' } }))
    expect(taskService.updateTaskStatus).toHaveBeenCalledWith(1, 'review')
  })

  it('puts the card back if the server refuses', async () => {
    taskService.updateTaskStatus.mockRejectedValue({ response: { status: 403, data: { error: { message: 'No' } } } })
    const { result, statusOf } = setup()

    act(() => result.current.mutate({ taskId: 1, status: 'completed' }))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(statusOf(1)).toBe('todo')
  })
})
