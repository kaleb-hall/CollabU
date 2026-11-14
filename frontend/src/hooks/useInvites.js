import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inviteService } from '../services/inviteService'
import { queryKeys } from './queryKeys'

export function useInvite(token) {
  return useQuery({
    queryKey: queryKeys.invite(token),
    queryFn: () => inviteService.get(token),
    select: (data) => data.invite,
  })
}

export function useAcceptInvite(token) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => inviteService.accept(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  })
}

export function useProjectInvites(projectId, enabled) {
  return useQuery({
    queryKey: queryKeys.projectInvites(projectId),
    queryFn: () => inviteService.listForProject(projectId),
    select: (data) => data.invites,
    enabled,
  })
}

function useInviteMutation(projectId, mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectInvites(projectId) }),
  })
}

export const useCreateInvite = (projectId) =>
  useInviteMutation(projectId, (invite) => inviteService.create(projectId, invite))
export const useCancelInvite = (projectId) =>
  useInviteMutation(projectId, (inviteId) => inviteService.cancel(projectId, inviteId))
