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
