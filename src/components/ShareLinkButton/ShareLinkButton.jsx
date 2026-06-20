import { useState } from 'react'
import { buildShareUrl, shareLink } from '../../lib/share-link.js'
import './ShareLinkButton.css'

export default function ShareLinkButton({ state }) {
  const [status, setStatus] = useState('')

  // Nothing meaningful to view until there's at least one expense — mirror the
  // text Share button so both share actions appear together.
  if (state.expenses.length === 0) return null

  async function onShare() {
    const url = buildShareUrl(state)
    if (url === null) {
      setStatus('Too large to share by link — use Share')
      setTimeout(() => setStatus(''), 2500)
      return
    }
    const result = await shareLink(url)
    if (result === 'copied') setStatus('Link copied')
    else if (result === 'failed') setStatus('Could not share')
    else setStatus('') // shared or cancelled — no message needed
    if (result === 'copied' || result === 'failed') {
      setTimeout(() => setStatus(''), 2500)
    }
  }

  return (
    <div className="share-link">
      <button
        type="button"
        className="share-link-btn"
        aria-label="Share a link to this split"
        onClick={onShare}
      >
        <svg
          className="share-link-icon"
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
        Link
      </button>
      {status && (
        <span className="share-link-status" role="status">
          {status}
        </span>
      )}
    </div>
  )
}
