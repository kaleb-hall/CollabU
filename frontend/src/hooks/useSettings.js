import { useMutation, useQuery } from '@tanstack/react-query'
import { userService } from '../services/userService'
import { useAuth } from './useAuth'
import { queryKeys } from './queryKeys'

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => userService.me(),
    select: (data) => data.user,
  })
}

export function useUpdateProfile() {
  const { updateUser } = useAuth()
  return useMutation({
    mutationFn: (changes) => userService.updateProfile(changes),
    onSuccess: (data) => updateUser(data.user),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) => userService.changePassword(currentPassword, newPassword),
  })
}
