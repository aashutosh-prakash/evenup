import { render, screen } from '@testing-library/react'
import AppFooter from './AppFooter.jsx'

const realUserAgent = window.navigator.userAgent

function setUserAgent(value) {
  Object.defineProperty(window.navigator, 'userAgent', { value, configurable: true })
}

afterEach(() => {
  setUserAgent(realUserAgent)
})

describe('AppFooter', () => {
  it('shows the trust signals', () => {
    render(<AppFooter />)
    expect(screen.getByText(/stays on your device/i)).toBeInTheDocument()
    expect(screen.getByText(/works offline/i)).toBeInTheDocument()
  })

  it('shows the storage caveat on iOS when storage is not persisted', async () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    )
    render(<AppFooter />)
    // Resolved asynchronously from navigator.storage.persisted().
    expect(
      await screen.findByText(/can be cleared after about a week/i),
    ).toBeInTheDocument()
  })

  it('omits the storage caveat in non-WebKit browsers', () => {
    render(<AppFooter />)
    expect(
      screen.queryByText(/can be cleared after about a week/i),
    ).not.toBeInTheDocument()
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
