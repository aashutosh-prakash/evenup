import { useMemo } from 'react'
import {
  computeBalances,
  computePaidTotals,
  computeTotal,
  settle,
  formatMoney,
  formatSigned,
} from '../../lib/settle.js'
import { personOf as findPerson } from '../../lib/expense.js'
import Avatar from '../Avatar/Avatar.jsx'
import ShareButton from '../ShareButton/ShareButton.jsx'
import './Summary.css'

// Classifies a net balance once into a bucket; class and label derive from it.
function netState(n) {
  if (n > 0.004) return 'pos'
  if (n < -0.004) return 'neg'
  return 'zero'
}
const NET_LABEL = { pos: 'is owed', neg: 'owes', zero: 'settled' }

export default function Summary({ state }) {
  const personOf = (id) => findPerson(state.people, id)
  const { paid, total, txns, balances } = useMemo(() => {
    const bal = computeBalances(state.people, state.expenses)
    return {
      paid: computePaidTotals(state.people, state.expenses),
      total: computeTotal(state.expenses),
      txns: settle(bal),
      balances: bal,
    }
  }, [state.people, state.expenses])

  const hasExpenses = state.expenses.length > 0

  return (
    <section className={`summary panel${!hasExpenses ? ' is-upcoming' : ''}`}>
      <div className="summary-head">
        <h2>Summary</h2>
        <ShareButton state={state} />
      </div>

      {!hasExpenses ? (
        <p className="empty">Add people and an expense to see the summary.</p>
      ) : (
        <>
          <h3>Paid</h3>
          <ul className="paid-list">
            {state.people.map((p) => {
              const net = balances[p.id] ?? 0
              const bucket = netState(net)
              return (
                <li key={p.id} className="paid-row">
                  <span className="person">
                    <Avatar person={p} size="sm" />
                    <span className="paid-name">
                      {p.name}
                      <span
                        className={`net net-${bucket}`}
                        title={`${p.name} ${NET_LABEL[bucket]}`}
                      >
                        {formatSigned(net)}
                      </span>
                    </span>
                  </span>
                  <span className="paid-amount">{formatMoney(paid[p.id] ?? 0)}</span>
                </li>
              )
            })}
            <li className="paid-row paid-total">
              <span>Total</span>
              <span className="paid-amount">{formatMoney(total)}</span>
            </li>
          </ul>

          <h3>Settle up</h3>
          <ul className="settlements">
            {txns.length === 0 && <li className="empty">Everyone is settled.</li>}
            {txns.map((t, i) => {
              const from = personOf(t.fromId)
              const to = personOf(t.toId)
              return (
                <li key={`${t.fromId}-${t.toId}-${i}`} className="settle-row">
                  <Avatar person={from} size="sm" />
                  <span className="settle-text">
                    <strong>{from.name}</strong>
                    <span className="settle-arrow" aria-label="pays">
                      →
                    </span>
                    <strong>{to.name}</strong>
                  </span>
                  <span className="settle-amount">{formatMoney(t.amount)}</span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
