import { render, screen, waitFor } from '@testing-library/react'
import AppFooter from './AppFooter.jsx'

afterEach(() => {
  delete navigator.storage
  delete window.matchMedia
})

describe('AppFooter', () => {
  it('shows the trust signals', () => {
    render(<AppFooter />)
    expect(screen.getByText(/stays on your device/i)).toBeInTheDocument()
    expect(screen.getByText(/works offline/i)).toBeInTheDocument()
  })

  it('shows the storage caveat when storage is not persistent', async () => {
    // No Storage API → persistence can't be granted → data is at risk.
    render(<AppFooter />)
    expect(await screen.findByText(/saved only in this browser/i)).toBeInTheDocument()
  })

  it('hides the storage caveat when storage is persisted', async () => {
    const persisted = vi.fn().mockResolvedValue(true)
    Object.defineProperty(navigator, 'storage', {
      value: { persisted, persist: vi.fn() },
      configurable: true,
    })
    render(<AppFooter />)
    await waitFor(() => expect(persisted).toHaveBeenCalled())
    expect(screen.queryByText(/saved only in this browser/i)).not.toBeInTheDocument()
  })

  it('links feedback to the GitHub issue tracker in a new tab', () => {
    render(<AppFooter />)
    const link = screen.getByRole('link', { name: /feedback/i })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/aashutosh-prakash/evenup/issues/new',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })
})
