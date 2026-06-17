import { render, screen, fireEvent } from '@testing-library/react'

// Mutable, hoisted state so each test can control what the SW hook reports.
const h = vi.hoisted(() => ({
  needRefresh: false,
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(),
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [h.needRefresh, h.setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: h.updateServiceWorker,
  }),
}))

import PWAUpdater from './PWAUpdater.jsx'

afterEach(() => {
  h.needRefresh = false
  vi.clearAllMocks()
})

describe('PWAUpdater', () => {
  it('renders nothing when no update is pending', () => {
    h.needRefresh = false
    const { container } = render(<PWAUpdater />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows an update toast and reloads to the new version on Reload', () => {
    h.needRefresh = true
    render(<PWAUpdater />)
    expect(screen.getByText(/new version of evenup is available/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /reload/i }))
    expect(h.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('dismisses the toast on Later', () => {
    h.needRefresh = true
    render(<PWAUpdater />)
    fireEvent.click(screen.getByRole('button', { name: /later/i }))
    expect(h.setNeedRefresh).toHaveBeenCalledWith(false)
  })
})
