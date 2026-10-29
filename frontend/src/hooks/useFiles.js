import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fileService } from '../services/fileService'
import { queryKeys } from './queryKeys'

export function useFiles(projectId, taskId) {
  return useQuery({
    queryKey: taskId ? queryKeys.taskFiles(projectId, taskId) : queryKeys.files(projectId),
    queryFn: () => fileService.list(projectId, taskId),
    select: (data) => data.files,
  })
}

// Project and task file lists share a prefix, so one invalidation refreshes both
function useFileMutation(projectId, mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.files(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(projectId) }),
    ]),
  })
}

export const useUploadFile = (projectId, taskId) =>
  useFileMutation(projectId, (file) => fileService.upload(projectId, file, taskId))
export const useDeleteFile = (projectId) =>
  useFileMutation(projectId, (fileId) => fileService.remove(fileId))
