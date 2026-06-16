import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary.jsx'

function Boom() {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('shows the recovery fallback when a child throws', () => {
    // Suppress the expected React error logging for this render.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset data/i })).toBeInTheDocument()
    spy.mockRestore()
  })
})
