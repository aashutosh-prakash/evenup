import { computeBalances, computePaidTotals, settle, formatMoney } from '../lib/settle.js'
import Avatar from './Avatar.jsx'
import ShareButton from './ShareButton.jsx'

export default function Summary({ state }) {
  const personOf = (id) =>
    state.people.find((p) => p.id === id) ?? { id, name: '(removed)' }
  const paid = computePaidTotals(state.people, state.expenses)
  const txns = settle(computeBalances(state.people, state.expenses))

  return (
    <section className="summary panel">
      <div className="summary-head">
        <h2>Summary</h2>
        <ShareButton state={state} />
      </div>

      <h3>Paid</h3>
      <ul className="paid-list">
        {state.people.map((p) => (
          <li key={p.id} className="paid-row">
            <span className="person">
              <Avatar person={p} size="sm" />
              {p.name}
            </span>
            <span className="paid-amount">{formatMoney(paid[p.id] ?? 0)}</span>
          </li>
        ))}
        {state.people.length === 0 && <li className="empty">No people yet.</li>}
      </ul>

      <h3>Settle up</h3>
      <ul className="settlements">
        {txns.length === 0 && <li className="empty">Everyone is settled.</li>}
        {txns.map((t) => (
          <li key={`${t.fromId}-${t.toId}`} className="settle-row">
            <Avatar person={personOf(t.fromId)} size="sm" />
            <span className="settle-arrow" aria-label="pays">→</span>
            <Avatar person={personOf(t.toId)} size="sm" />
            <span className="settle-amount">{formatMoney(t.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
