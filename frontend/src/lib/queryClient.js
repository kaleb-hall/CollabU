import { QueryClient } from '@tanstack/react-query'

// 4xx means the server understood and said no; retrying will not help.
export function shouldRetry(failureCount, error) {
  const status = error?.response?.status
  if (status && status < 500) return false
  return failureCount < 1
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
