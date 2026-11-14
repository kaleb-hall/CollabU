import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/notificationService'
import { queryKeys } from './queryKeys'

const POLL_EVERY = 60_000

// Polls once a minute while the tab is visible. React Query pauses it in background tabs.
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => notificationService.unreadCount(),
    select: (data) => data.unread_count,
    refetchInterval: POLL_EVERY,
  })
}

export function useNotificationList(enabled) {
  return useInfiniteQuery({
    queryKey: queryKeys.notificationList,
    queryFn: ({ pageParam }) => notificationService.list(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.notifications),
    enabled,
  })
}

function useNotificationMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  })
}

export const useMarkRead = () => useNotificationMutation((id) => notificationService.markRead(id))
export const useMarkAllRead = () => useNotificationMutation(() => notificationService.markAllRead())
