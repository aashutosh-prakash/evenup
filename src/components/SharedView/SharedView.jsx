import { personOf as findPerson } from '../../lib/expense.js'
import { formatMoney } from '../../lib/settle.js'
import Summary from '../Summary/Summary.jsx'
import AppFooter from '../AppFooter/AppFooter.jsx'
import './SharedView.css'

// Read-only page shown when the app is opened via a share link. It renders a
// self-contained .app shell so it can stand in for the full editor: a banner
// to save a copy or exit, a read-only expense list, and the reused Summary +
// AppFooter. No inputs, no dispatch — nothing here mutates state.
export default function SharedView({ split, onSave, onExit }) {
  const personOf = (id) => findPerson(split.people, id)
  const title = split.title?.trim() ? split.title : 'Shared split'

  return (
    <div className="app">
      <header className="shared-header">
        <h1>EvenKar</h1>
        <p className="shared-subtitle">Shared split</p>
      </header>

      <div className="shared-banner" role="region" aria-label="Shared split actions">
        <span className="shared-banner-text">You&apos;re viewing a shared split.</span>
        <div className="shared-banner-actions">
          <button type="button" className="shared-save" onClick={onSave}>
            Save a copy to my device
          </button>
          <button type="button" className="shared-exit" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>

      <main className="shared-main">
        <h2>{title}</h2>

        <ul className="shared-expenses panel">
          {split.expenses.map((e) => {
            const payer = personOf(e.paidById)
            const n = Array.isArray(e.participantIds) ? e.participantIds.length : 0
            return (
              <li key={e.id} className="shared-expense">
                <div className="shared-expense-head">
                  <span className="shared-expense-desc">
                    {e.description || 'Expense'}
                  </span>
                  <span className="shared-expense-amount">{formatMoney(e.amount)}</span>
                </div>
                <p className="shared-expense-meta">
                  Paid by {payer.name} · split {n} ways
                </p>
              </li>
            )
          })}
        </ul>

        <Summary state={split} />
      </main>

      <AppFooter />
    </div>
  )
}
