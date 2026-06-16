import { computeBalances, settle, formatMoney } from '../lib/settle.js'

export default function Summary({ state }) {
  const nameOf = (id) => state.people.find((p) => p.id === id)?.name ?? '(removed)'
  const balances = computeBalances(state.people, state.expenses)
  const txns = settle(balances)
  const sym = state.currencySymbol

  return (
    <section className="summary panel">
      <h2>Summary</h2>

      <h3>Balances</h3>
      <ul className="balances">
        {state.people.map((p) => {
          const bal = balances[p.id] ?? 0
          const cls = bal > 0 ? 'pos' : bal < 0 ? 'neg' : 'zero'
          const label =
            bal > 0 ? 'is owed' : bal < 0 ? 'owes' : 'is settled'
          return (
            <li key={p.id} className={cls}>
              {p.name} {label} {bal !== 0 && formatMoney(Math.abs(bal), sym)}
            </li>
          )
        })}
        {state.people.length === 0 && <li className="empty">No people yet.</li>}
      </ul>

      <h3>Settle up</h3>
      <ul className="settlements">
        {txns.length === 0 && <li className="empty">Everyone is settled.</li>}
        {txns.map((t, i) => (
          <li key={i}>
            {nameOf(t.fromId)} pays {nameOf(t.toId)} {formatMoney(t.amount, sym)}
          </li>
        ))}
      </ul>
    </section>
  )
}
