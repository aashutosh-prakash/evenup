import { useEffect, useState } from 'react'
import './InstallButton.css'

// Is the app already running as an installed PWA? (standalone window)
function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari exposes this non-standard flag instead of display-mode.
    window.navigator.standalone === true
  )
}

// iOS Safari never fires `beforeinstallprompt`, so we can't trigger a native
// install — install is always the manual "Add to Home Screen" flow.
function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

// Desktop Safari also has no install API; the user installs via File → Add to
// Dock (Safari 17+). vendor === 'Apple Computer, Inc.' identifies WebKit/Safari,
// and excluding Chrome/Android/iOS narrows it to Safari on macOS.
function isDesktopSafari() {
  const ua = window.navigator.userAgent
  return (
    window.navigator.vendor === 'Apple Computer, Inc.' &&
    /safari/i.test(ua) &&
    !/chrome|crios|fxios|edg|android/i.test(ua) &&
    !isIos()
  )
}

// "Install app" — only renders when installation is actually possible:
//  • Chrome/Android: captures `beforeinstallprompt` and fires the native prompt.
//  • iOS Safari: a short "Add to Home Screen" instruction sheet.
//  • Desktop Safari: a short "Add to Dock" instruction sheet.
// Renders nothing once installed, or where install isn't offered.
export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showSheet, setShowSheet] = useState(false)
  const [installed, setInstalled] = useState(() => isStandalone())

  useEffect(() => {
    function onBeforeInstall(e) {
      // Stop Chrome's mini-infobar so we control when/where to offer install.
      e.preventDefault()
      setDeferredPrompt(e)
    }
    function onInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
      setShowSheet(false)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Already installed — nothing to offer.
  if (installed) return null

  // Browsers without a native prompt fall back to manual instructions.
  const manual = isIos() ? 'ios' : isDesktopSafari() ? 'desktop-safari' : null

  // No native prompt and no manual path — the browser doesn't support
  // installing here, so stay out of the way.
  if (!deferredPrompt && !manual) return null

  async function onClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice.catch(() => {})
      // A prompt can only be used once.
      setDeferredPrompt(null)
      return
    }
    setShowSheet(true)
  }

  return (
    <div className="install">
      <button
        type="button"
        className="install-btn"
        aria-label="Install EvenKar app"
        onClick={onClick}
      >
        <svg
          className="install-icon"
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 0 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1zM5 18a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
        </svg>
        Install app
      </button>

      {showSheet && (
        <div
          className="install-sheet"
          role="dialog"
          aria-label="How to install EvenKar"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowSheet(false)
          }}
        >
          <p className="install-sheet-title">Install EvenKar</p>
          <p className="install-sheet-body">
            {manual === 'ios' ? (
              <>
                Tap the <strong>Share</strong> icon in Safari, then choose{' '}
                <strong>Add to Home Screen</strong>.
              </>
            ) : (
              <>
                Open the <strong>File</strong> menu in Safari, then choose{' '}
                <strong>Add to Dock</strong>.
              </>
            )}{' '}
            Opens instantly and works fully offline.
          </p>
          <button type="button" onClick={() => setShowSheet(false)} autoFocus>
            Got it
          </button>
        </div>
      )}
    </div>
  )
}
