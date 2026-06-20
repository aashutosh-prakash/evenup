import { Component } from 'react'
import { clearStoredState } from '../../state/store.js'
import './ErrorBoundary.css'

// Top-level safety net. If anything throws during render the whole tree would
// otherwise unmount to a blank page — and because the in-app "Clear data"
// button lives inside that tree, a bad persisted blob would be unrecoverable
// without devtools. This catches the throw and offers a reset that clears the
// persisted state so a reload starts fresh.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  reset = () => {
    clearStoredState()
    // Full reload so the app re-mounts from a clean initial state.
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <h1>Something went wrong</h1>
          <p>
            EvenKar hit an unexpected error. Your saved data may be corrupted. You can
            reset it to start fresh — this clears all people and expenses stored in this
            browser.
          </p>
          <button type="button" className="danger" onClick={this.reset}>
            Reset data and reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
