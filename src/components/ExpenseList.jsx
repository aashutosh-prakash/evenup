import { formatMoney } from '../lib/settle.js'

export default function ExpenseList({ state, dispatch }) {
  const nameOf = (id) => state.people.find((p) => p.id === id)?.name ?? '(removed)'

  if (state.expenses.length === 0) {
    return <p className="empty">No expenses yet.</p>
  }

  return (
    <ul className="expense-list">
      {state.expenses.map((exp) => (
        <li key={exp.id} className="expense-item">
          <div className="expense-main">
            <strong>{exp.description}</strong>
            <span>{formatMoney(exp.amount, state.currencySymbol)}</span>
          </div>
          <div className="expense-meta">
            Paid by {nameOf(exp.paidById)} · split among{' '}
            {exp.participantIds.map(nameOf).join(', ')}
          </div>
          <button type="button" onClick={() => dispatch({ type: 'REMOVE_EXPENSE', id: exp.id })}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
