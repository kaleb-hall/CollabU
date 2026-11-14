import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageErrorBoundary from './PageErrorBoundary'

function Broken() {
  throw new TypeError('Failed to fetch dynamically imported module')
}

describe('PageErrorBoundary', () => {
  it('shows a way out instead of a blank page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    render(<PageErrorBoundary onReload={reload}><Broken /></PageErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent('This page did not load')
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(reload).toHaveBeenCalled()
  })

  it('shows the page when nothing goes wrong', () => {
    render(<PageErrorBoundary><p>All good</p></PageErrorBoundary>)
    expect(screen.getByText('All good')).toBeInTheDocument()
  })
})
