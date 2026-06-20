import { useEffect, useRef, useState } from 'react'
import { buildSummaryText, shareSummary } from '../../lib/share.js'
import { composeShareUrl, shareLink } from '../../lib/share-link.js'
import './ShareButton.css'

// Single "Share" action: prefer a link to the interactive read-only view, and
// fall back to the plain-text summary when a link can't be properly composed
// (split too large, or — defensively — fails its round-trip check).
export default function ShareButton({ state }) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  // One auto-clear timer at a time; cleared before re-arming and on unmount so
  // overlapping shares can't clear each other early and we never setState after
  // the component unmounts (e.g. a hashchange swaps the editor for SharedView).
  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Nothing meaningful to share without expenses.
  if (state.expenses.length === 0) return null

  function flash(message) {
    clearTimeout(timerRef.current)
    setStatus(message)
    if (message) timerRef.current = setTimeout(() => setStatus(''), 3000)
  }

  // Map a share/clipboard result to a status message. `label` is the success
  // noun ("Link" or "Summary"); shared/cancelled show nothing.
  function flashResult(result, label) {
    if (result === 'copied') flash(`${label} copied`)
    else if (result === 'failed') flash('Could not share')
    else flash('')
  }

  async function onShare() {
    // Guard against a second click while a share sheet is already open —
    // otherwise the in-progress share rejects and we'd fall back confusingly.
    if (busy) return
    setBusy(true)
    try {
      const url = composeShareUrl(state)
      if (url) {
        const title = (state.title || '').trim()
        const heading = title ? `EvenKar — ${title}` : 'EvenKar'
        flashResult(await shareLink(url, heading), 'Link')
      } else {
        // Link couldn't be composed (e.g. too large) — share the text summary.
        flashResult(await shareSummary(buildSummaryText(state)), 'Summary')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="share">
      <button
        type="button"
        className="share-btn"
        aria-label="Share this split"
        onClick={onShare}
      >
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
        Share
      </button>
      {/* Always rendered (reserves its line) so showing a message never shifts
          the layout. role=status announces it to screen readers when filled. */}
      <span className="share-status" role="status">
        {status}
      </span>
    </div>
  )
}
