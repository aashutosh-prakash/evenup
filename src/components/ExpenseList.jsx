import { formatMoney } from '../lib/settle.js'
import Avatar from './Avatar.jsx'

export default function ExpenseList({ state, dispatch }) {
  const personOf = (id) =>
    state.people.find((p) => p.id === id) ?? { id, name: '(removed)' }

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
                <span className="meta-group">
                  <span className="meta-label">Paid by</span>
                  <Avatar person={personOf(exp.paidById)} size="sm" />
                </span>
                <span className="meta-group">
                  <span className="meta-label">Split</span>
                  <span className="avatar-stack">
                    {exp.participantIds.map((id) => (
                      <Avatar key={id} person={personOf(id)} size="sm" />
                    ))}
                  </span>
                </span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => dispatch({ type: 'REMOVE_EXPENSE', id: exp.id })}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
