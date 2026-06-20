import { useMemo } from 'react'
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
  const title = split.title?.trim()
  const hasExpenses = split.expenses.length > 0
  // Derive once; recompute only when the split changes (matches Summary).
  const { byId, paid, total, txns } = useMemo(
    () => ({
      // Look people up in O(1); keep personOf's '(removed)' fallback below.
      byId: new Map(split.people.map((p) => [p.id, p])),
      paid: computePaidTotals(split.people, split.expenses),
      total: computeTotal(split.expenses),
      txns: settle(computeBalances(split.people, split.expenses)),
    }),
    [split.people, split.expenses],
  )
  const personOf = (id) => byId.get(id) ?? { id, name: '(removed)' }

  return (
    <div className="app shared-app">
      <div className="shared-banner" role="region" aria-label="Shared split actions">
        <span className="shared-banner-text">You&apos;re viewing a shared split.</span>
        <div className="shared-banner-actions">
          <button type="button" className="shared-save" onClick={onSave}>
            Save a copy to edit
          </button>
          <button type="button" className="shared-exit" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>

      <main className="receipt">
        <div className="receipt-body">
          <p className="receipt-store">EvenKar</p>
          {title && <p className="receipt-title">{title}</p>}
          <p className="receipt-sub">· shared split ·</p>
          {split.sharedAt && (
            <p className="receipt-date">
              {new Date(split.sharedAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}

          <div className="receipt-rule" />

          {!hasExpenses ? (
            <p className="receipt-empty">No expenses in this split yet.</p>
          ) : (
            <>
              <ul className="receipt-lines">
                {split.expenses.map((e) => {
                  const payer = e.paidById ? personOf(e.paidById) : null
                  const names = e.participantIds.map((id) => personOf(id).name).join(', ')
                  return (
                    <li key={e.id} className="receipt-exp">
                      <div className="receipt-line">
                        <span className="receipt-desc">{e.description || 'Expense'}</span>
                        <span className="receipt-dots" aria-hidden="true" />
                        <span className="receipt-amt">{formatMoney(e.amount)}</span>
                      </div>
                      <p className="receipt-meta">
                        {payer && (
                          <>
                            paid <strong>{payer.name}</strong> ·{' '}
                          </>
                        )}
                        split {names || '—'}
                      </p>
                    </li>
                  )
                })}
              </ul>

              <div className="receipt-rule" />
              <div className="receipt-total">
                <span>TOTAL</span>
                <span className="receipt-amt">{formatMoney(total)}</span>
              </div>

              <div className="receipt-rule dashed" />
              <p className="receipt-section">Who paid</p>
              <ul className="receipt-lines">
                {split.people
                  .filter((p) => (paid[p.id] ?? 0) > 0)
                  .map((p) => (
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
            </>
          )}

          <div className="receipt-rule dashed" />
          <p className="receipt-thanks">— thank you —</p>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
