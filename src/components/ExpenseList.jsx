import { formatMoney } from '../lib/settle.js'

export default function ExpenseList({ state, dispatch }) {
  const nameOf = (id) => state.people.find((p) => p.id === id)?.name ?? '(removed)'

  return (
    <section className="expense-list-section panel">
      <h2>Expenses</h2>
      {state.expenses.length === 0 ? (
        <p className="empty">No expenses yet.</p>
      ) : (
        <ul className="expense-list">
          {state.expenses.map((exp) => (
            <li key={exp.id} className="expense-item">
              <div className="expense-main">
                <strong className="expense-desc">{exp.description}</strong>
                <span className="expense-amount">{formatMoney(exp.amount)}</span>
              </div>
              <div className="expense-meta">
                Paid by {nameOf(exp.paidById)} · split among{' '}
                {exp.participantIds.map(nameOf).join(', ')}
              </div>
              <button
                type="button"
                className="remove-btn"
                onClick={() => dispatch({ type: 'REMOVE_EXPENSE', id: exp.id })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
