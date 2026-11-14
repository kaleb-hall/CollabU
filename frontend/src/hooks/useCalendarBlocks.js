import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '../services/calendarService'
import { queryKeys } from './queryKeys'

export function useCalendarBlocks({ start, end }) {
  return useQuery({
    queryKey: queryKeys.calendarRange(start, end),
    queryFn: () => calendarService.getCalendarBlocks(start, end),
    select: (data) => data.blocks,
    placeholderData: (previous) => previous,
  })
}

function useBlockMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    // Busy time changes free hours, so workload views refresh too
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarBlocks }),
      queryClient.invalidateQueries({ queryKey: ['workload'] }),
    ]),
  })
}

export const useCreateBlock = () => useBlockMutation((block) => calendarService.createCalendarBlock(block))
export const useDeleteBlock = () => useBlockMutation((blockId) => calendarService.deleteCalendarBlock(blockId))
