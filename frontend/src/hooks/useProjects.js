import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../services/projectService'
import { userService } from '../services/userService'
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

export function useAddMember(projectId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (member) => projectService.addMember(projectId, member),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects, exact: true }),
    ]),
  })
}

export function useUserSearch(search) {
  return useQuery({
    queryKey: queryKeys.users(search),
    queryFn: () => userService.searchUsers(search),
    select: (data) => data.users,
    placeholderData: (previous) => previous,
  })
}
