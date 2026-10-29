import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../services/taskService'
import { queryKeys } from './queryKeys'

export function useProjectTasks(projectId) {
  return useQuery({
    queryKey: queryKeys.projectTasks(projectId),
    queryFn: () => taskService.getProjectTasks(projectId),
    select: (data) => data.tasks,
  })
}

export function useMyTasks() {
  return useQuery({
    queryKey: queryKeys.myTasks,
    queryFn: () => taskService.getMyTasks(),
    select: (data) => data.tasks,
  })
}

// Anything that changes a task changes the board, my tasks, project progress and the feed.
function useInvalidateTasks(projectId) {
  const queryClient = useQueryClient()
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myTasks }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects, exact: true }),
    queryClient.invalidateQueries({ queryKey: queryKeys.activity(projectId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.workload(projectId) }),
  ])
}

export function useCreateTask(projectId) {
  const invalidate = useInvalidateTasks(projectId)
  return useMutation({
    mutationFn: (task) => taskService.createTask(projectId, task),
    onSuccess: invalidate,
  })
}

export function useUpdateTask(projectId) {
  const invalidate = useInvalidateTasks(projectId)
  return useMutation({
    mutationFn: ({ taskId, changes }) => taskService.updateTask(taskId, changes),
    onSuccess: invalidate,
  })
}

// Moves the card right away, then puts it back if the server says no.
export function useMoveTask(projectId) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTasks(projectId)
  const key = queryKeys.projectTasks(projectId)

  return useMutation({
    mutationFn: ({ taskId, status }) => taskService.updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (data) => data && {
        ...data,
        tasks: data.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
      })
      return { previous }
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(key, context.previous),
    onSettled: invalidate,
  })
}

export function useCalculateSchedule(projectId) {
  const invalidate = useInvalidateTasks(projectId)
  return useMutation({
    mutationFn: (timeZone) => taskService.calculateSchedule(projectId, timeZone),
    onSuccess: invalidate,
  })
}
