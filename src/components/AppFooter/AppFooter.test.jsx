import { render, screen } from '@testing-library/react'
import AppFooter from './AppFooter.jsx'

describe('AppFooter', () => {
  it('shows the trust signals', () => {
    render(<AppFooter />)
    expect(screen.getByText(/stays on your device/i)).toBeInTheDocument()
    expect(screen.getByText(/works offline/i)).toBeInTheDocument()
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
