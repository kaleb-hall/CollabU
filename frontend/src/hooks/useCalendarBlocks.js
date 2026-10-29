import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '../services/calendarService'
import { queryKeys } from './queryKeys'

export function useCalendarBlocks() {
  return useQuery({
    queryKey: queryKeys.calendarBlocks,
    queryFn: () => calendarService.getCalendarBlocks(),
    select: (data) => data.blocks,
  })
}

function useBlockMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.calendarBlocks }),
  })
}

export const useCreateBlock = () => useBlockMutation((block) => calendarService.createCalendarBlock(block))
export const useDeleteBlock = () => useBlockMutation((blockId) => calendarService.deleteCalendarBlock(blockId))
