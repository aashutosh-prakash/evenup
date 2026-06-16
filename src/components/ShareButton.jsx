import { useState } from 'react'
import { buildSummaryText, shareSummary } from '../lib/share.js'

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
        Share summary
      </button>
      {status && <span className="share-status" role="status">{status}</span>}
    </div>
  )
}
