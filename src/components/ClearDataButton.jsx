import { useState } from 'react'

// "Clear all data" with a two-step confirmation so a single click can't
// accidentally wipe everything. First click arms; the confirm panel must then
// be explicitly confirmed before the reset is dispatched.
export default function ClearDataButton({ state, dispatch }) {
  const [confirming, setConfirming] = useState(false)

  const hasData = state.people.length > 0 || state.expenses.length > 0
  if (!hasData) return null

  function clearAll() {
    dispatch({ type: 'CLEAR_ALL' })
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="clear-confirm" role="alertdialog" aria-label="Confirm clearing all data">
        <span>Delete all people and expenses? This can't be undone.</span>
        <button type="button" className="danger" onClick={clearAll}>
          Yes, clear everything
        </button>
        <button type="button" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button type="button" className="clear-btn" onClick={() => setConfirming(true)}>
      Clear all data
    </button>
  )
}
