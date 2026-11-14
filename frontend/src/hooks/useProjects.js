import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../services/projectService'
import { queryKeys } from './queryKeys'

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => projectService.getProjects(),
    select: (data) => data.projects,
  })
}

export function useProject(id) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => projectService.getProject(id),
    select: (data) => data.project,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (project) => projectService.createProject(project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects, exact: true }),
  })
}

export function useActivity(projectId) {
  return useInfiniteQuery({
    queryKey: queryKeys.activity(projectId),
    queryFn: ({ pageParam }) => projectService.getActivity(projectId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.activities),
  })
}

export function useWorkload(projectId) {
  return useQuery({
    queryKey: queryKeys.workload(projectId),
    queryFn: () => projectService.getWorkload(projectId),
  })
}

export function useRemoveMember(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId) => projectService.removeMember(projectId, memberId),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects, exact: true }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workload(projectId) }),
    ]),
  })
}

export function useProjectSummary(projectId, enabled) {
  return useQuery({
    queryKey: queryKeys.summary(projectId),
    queryFn: () => projectService.getSummary(projectId),
    enabled,
  })
}

// Complete, reopen, lock, archive and the final note all answer with the updated project
function useProjectChange(projectId, change) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: change,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.project(projectId), data)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projects, exact: true }),
        queryClient.invalidateQueries({ queryKey: queryKeys.summary(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activity(projectId) }),
      ])
    },
  })
}

export const useCompleteProject = (projectId) => useProjectChange(projectId, () => projectService.complete(projectId))
export const useReopenProject = (projectId) => useProjectChange(projectId, () => projectService.reopen(projectId))
export const useSetLocked = (projectId) => useProjectChange(projectId, (locked) => projectService.setLocked(projectId, locked))
export const useSetArchived = (projectId) => useProjectChange(projectId, (archived) => projectService.setArchived(projectId, archived))
export const useSendFinalNote = (projectId) => useProjectChange(projectId, (message) => projectService.sendFinalNote(projectId, message))

export function useUpdateMySettings(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings) => projectService.updateMySettings(projectId, settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
  })
}
