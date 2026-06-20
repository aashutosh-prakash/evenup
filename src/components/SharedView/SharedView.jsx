import Logo from '../Logo/Logo.jsx'
import ExpenseList from '../ExpenseList/ExpenseList.jsx'
import Summary from '../Summary/Summary.jsx'
import AppFooter from '../AppFooter/AppFooter.jsx'
import './SharedView.css'

// Read-only page shown when the app is opened via a share link. It renders a
// self-contained .app shell so it can stand in for the full editor: a banner
// to save a copy or exit, a read-only expense list, and the reused Summary +
// AppFooter. No inputs, no dispatch — nothing here mutates state.
export default function SharedView({ split, onSave, onExit }) {
  const title = split.title?.trim() || ''

  return (
    <div className="app shared-app">
      <header className="app-header">
        <div className="app-title">
          <div className="brand-row">
            <span className="brand-name">
              <Logo />
              <h1>EvenKar</h1>
            </span>
            {title && <span className="shared-title">{title}</span>}
          </div>
          <p className="tagline">Shared split</p>
        </div>
      </header>

      <div className="shared-banner" role="region" aria-label="Shared split actions">
        <span className="shared-banner-text">You&apos;re viewing a shared split.</span>
        <div className="shared-banner-actions">
          <button type="button" className="shared-save" onClick={onSave}>
            Save a copy
          </button>
          <button type="button" className="shared-exit" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>

      <main className="shared-main">
        <ExpenseList state={split} readOnly />
        <Summary state={split} showShare={false} />
      </main>

      <AppFooter />
    </div>
  )
}
