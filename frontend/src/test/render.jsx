import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createQueryClient } from '../lib/queryClient'
import { AuthContext } from '../contexts/authContext'

// Renders a component with React Query, a router and a fake logged-in user.
export function renderWithProviders(ui, { user = null, route = '/', path = '*', auth = {} } = {}) {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0 } })
  const authValue = { user, isAuthenticated: !!user, login: async () => {}, register: async () => {}, logout: () => {}, ...auth }
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="*" element={<p>Landed on another page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  )
  return { ...result, queryClient }
}
