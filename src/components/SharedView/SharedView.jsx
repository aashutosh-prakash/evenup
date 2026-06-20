import { personOf as findPerson } from '../../lib/expense.js'
import {
  computeBalances,
  computePaidTotals,
  computeTotal,
  settle,
  formatMoney,
} from '../../lib/settle.js'
import AppFooter from '../AppFooter/AppFooter.jsx'
import './SharedView.css'

// Read-only page shown when the app is opened via a share link, styled like a
// printed receipt. The Save-a-copy / Exit actions stay above the paper so the
// receipt itself reads cleanly. Nothing here mutates state.
export default function SharedView({ split, onSave, onExit }) {
  const personOf = (id) => findPerson(split.people, id)
  const title = split.title?.trim() || 'Shared split'
  const paid = computePaidTotals(split.people, split.expenses)
  const total = computeTotal(split.expenses)
  const txns = settle(computeBalances(split.people, split.expenses))

  return (
    <div className="app shared-app">
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

      <main className="receipt">
        <div className="receipt-body">
          <p className="receipt-store">EvenKar</p>
          <p className="receipt-title">{title}</p>
          <p className="receipt-sub">· shared split ·</p>

          <div className="receipt-rule" />

          <ul className="receipt-lines">
            {split.expenses.map((e) => (
              <li key={e.id} className="receipt-line">
                <span className="receipt-desc">{e.description || 'Expense'}</span>
                <span className="receipt-dots" aria-hidden="true" />
                <span className="receipt-amt">{formatMoney(e.amount)}</span>
              </li>
            ))}
          </ul>

          <div className="receipt-rule" />
          <div className="receipt-total">
            <span>TOTAL</span>
            <span className="receipt-amt">{formatMoney(total)}</span>
          </div>

          <div className="receipt-rule dashed" />
          <p className="receipt-section">Who paid</p>
          <ul className="receipt-lines">
            {split.people.map((p) => (
              <li key={p.id} className="receipt-line">
                <span className="receipt-desc">{p.name}</span>
                <span className="receipt-dots" aria-hidden="true" />
                <span className="receipt-amt">{formatMoney(paid[p.id] ?? 0)}</span>
              </li>
            ))}
          </ul>

          <div className="receipt-rule dashed" />
          <p className="receipt-section">Settle up</p>
          {txns.length === 0 ? (
            <p className="receipt-settled">Everyone is settled 🎉</p>
          ) : (
            <ul className="receipt-lines">
              {txns.map((t, i) => (
                <li key={`${t.fromId}-${t.toId}-${i}`} className="receipt-line">
                  <span className="receipt-desc">
                    {personOf(t.fromId).name} → {personOf(t.toId).name}
                  </span>
                  <span className="receipt-dots" aria-hidden="true" />
                  <span className="receipt-amt">{formatMoney(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="receipt-rule dashed" />
          <p className="receipt-thanks">— thank you —</p>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
