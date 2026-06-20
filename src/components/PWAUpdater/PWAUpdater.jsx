import { useRegisterSW } from 'virtual:pwa-register/react'
import './PWAUpdater.css'

// Registers the service worker (production builds only) and surfaces a small
// toast when a new deploy is available, so the user updates on their terms
// instead of the page reloading underneath them.
export default function PWAUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="pwa-toast" role="alert">
      <span className="pwa-toast-msg">A new version of EvenKar is available.</span>
      <div className="pwa-toast-actions">
        <button
          type="button"
          className="pwa-toast-reload"
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </div>
    </div>
  )
}
