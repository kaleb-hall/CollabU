import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentService } from '../services/commentService'
import { queryKeys } from './queryKeys'

export function useComments(taskId) {
  return useQuery({
    queryKey: queryKeys.comments(taskId),
    queryFn: () => commentService.list(taskId),
    select: (data) => data.comments,
  })
}

function useCommentMutation(taskId, projectId, mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(taskId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(projectId) }),
    ]),
  })
}

export const useAddComment = (taskId, projectId) =>
  useCommentMutation(taskId, projectId, (body) => commentService.add(taskId, body))
export const useDeleteComment = (taskId, projectId) =>
  useCommentMutation(taskId, projectId, (commentId) => commentService.remove(taskId, commentId))
