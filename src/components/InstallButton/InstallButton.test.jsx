import { render, screen, fireEvent, act } from '@testing-library/react'
import InstallButton from './InstallButton.jsx'

const realUserAgent = window.navigator.userAgent
const realVendor = window.navigator.vendor

function setUserAgent(value) {
  Object.defineProperty(window.navigator, 'userAgent', { value, configurable: true })
}

function setVendor(value) {
  Object.defineProperty(window.navigator, 'vendor', { value, configurable: true })
}

afterEach(() => {
  setUserAgent(realUserAgent)
  setVendor(realVendor)
  delete window.matchMedia
})

describe('InstallButton', () => {
  it('renders nothing when already installed (standalone)', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const { container } = render(<InstallButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing in a browser that does not offer install', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    const { container } = render(<InstallButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the button after beforeinstallprompt and fires the native prompt', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    render(<InstallButton />)

    const event = new Event('beforeinstallprompt')
    event.prompt = vi.fn()
    event.userChoice = Promise.resolve({ outcome: 'accepted' })
    act(() => {
      window.dispatchEvent(event)
    })

    const btn = await screen.findByRole('button', { name: /install evenkar app/i })
    await act(async () => {
      fireEvent.click(btn)
    })
    expect(event.prompt).toHaveBeenCalled()
  })

  it('shows Add-to-Home-Screen instructions on iOS Safari', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    )
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    render(<InstallButton />)

    fireEvent.click(screen.getByRole('button', { name: /install evenkar app/i }))
    expect(screen.getByRole('dialog', { name: /how to install/i })).toBeInTheDocument()
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()
  })

  it('shows Add-to-Dock instructions on desktop Safari', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    )
    setVendor('Apple Computer, Inc.')
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    render(<InstallButton />)

    fireEvent.click(screen.getByRole('button', { name: /install evenkar app/i }))
    expect(screen.getByText(/add to dock/i)).toBeInTheDocument()
  })
})
