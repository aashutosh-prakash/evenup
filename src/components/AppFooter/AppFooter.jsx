import { useEffect, useState } from 'react'
import InstallButton from '../InstallButton/InstallButton.jsx'
import { isStorageEvictionRisk } from '../../lib/platform.js'
import './AppFooter.css'

const FEEDBACK_URL = 'https://github.com/aashutosh-prakash/evenup/issues/new'

// App-level footer: quiet trust signals + meta actions (Feedback, Install).
// Kept separate from the header, which owns per-split actions (Clear all data).
export default function AppFooter() {
  // Whether to warn about storage eviction depends on the real persisted()
  // state, which is async — resolve it once after mount.
  const [storageAtRisk, setStorageAtRisk] = useState(false)
  useEffect(() => {
    let active = true
    isStorageEvictionRisk().then((risk) => {
      if (active) setStorageAtRisk(risk)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <footer className="app-footer">
      <ul className="trust-chips" aria-label="About EvenKar">
        <li>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 1.5 4 5v6c0 5 3.4 9.3 8 10.5 4.6-1.2 8-5.5 8-10.5V5l-8-3.5zm0 6a2.5 2.5 0 0 1 1 4.78V14a1 1 0 1 1-2 0v-1.72A2.5 2.5 0 0 1 12 7.5z" />
          </svg>
          Private — stays on your device
        </li>
        <li>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M13 2 4.5 13.5H11l-1 8.5 9.5-12H13l0-8z" />
          </svg>
          Works offline
        </li>
      </ul>

      <div className="footer-actions">
        <a
          className="feedback-link"
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Send feedback on GitHub"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
          Feedback
        </a>
        <InstallButton />
      </div>

      {storageAtRisk && (
        <p className="storage-note">
          On iPhone, iPad, and Safari, saved splits can be cleared after about a week
          unused. Install the app to keep them — or use Share to save a copy.
        </p>
      )}
    </footer>
  )
}
