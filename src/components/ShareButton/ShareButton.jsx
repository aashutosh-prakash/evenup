import { useState } from 'react'
import { buildSummaryText, shareSummary } from '../../lib/share.js'
import './ShareButton.css'

export default function ShareButton({ state }) {
  const [status, setStatus] = useState('')

  // Nothing meaningful to share without expenses.
  if (state.expenses.length === 0) return null

  async function onShare() {
    const result = await shareSummary(buildSummaryText(state))
    if (result === 'copied') setStatus('Copied to clipboard')
    else if (result === 'failed') setStatus('Could not share')
    else setStatus('') // shared or cancelled — no message needed
    if (result === 'copied' || result === 'failed') {
      setTimeout(() => setStatus(''), 2500)
    }
  }

  return (
    <div className="share">
      <button type="button" className="share-btn" onClick={onShare}>
        <svg
          className="share-icon"
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
        </svg>
        Share summary
      </button>
      {status && (
        <span className="share-status" role="status">
          {status}
        </span>
      )}
    </div>
  )
}
