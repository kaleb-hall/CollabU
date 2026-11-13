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
function invalidateTaskQueries(queryClient, projectId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myTasks }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects, exact: true }),
    queryClient.invalidateQueries({ queryKey: queryKeys.activity(projectId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.workload(projectId) }),
  ])
}

function useInvalidateTasks(projectId) {
  const queryClient = useQueryClient()
  return () => invalidateTaskQueries(queryClient, projectId)
}

// Create a task in any project (the project is chosen in the form)
export function useCreateTaskIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, task }) => taskService.createTask(projectId, task),
    onSuccess: (_data, { projectId }) => invalidateTaskQueries(queryClient, projectId),
  })
}

// Change one of my tasks' status from a list (checking it off): updates my list right away
export function useSetMyTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ task, status }) => taskService.updateTaskStatus(task.id, status),
    onMutate: async ({ task, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.myTasks })
      const previous = queryClient.getQueryData(queryKeys.myTasks)
      queryClient.setQueryData(queryKeys.myTasks, (data) => data && {
        ...data,
        tasks: data.tasks.map((item) => (item.id === task.id ? { ...item, status } : item)),
      })
      return { previous }
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(queryKeys.myTasks, context.previous),
    onSettled: (_data, _error, { task }) => invalidateTaskQueries(queryClient, task.project_id),
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

export function useDeleteTask(projectId) {
  const invalidate = useInvalidateTasks(projectId)
  return useMutation({
    mutationFn: (taskId) => taskService.deleteTask(taskId),
    onSuccess: invalidate,
  })
}
