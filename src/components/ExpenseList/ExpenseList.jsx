import { useState } from 'react'
import { formatMoney } from '../../lib/settle.js'
import { personOf as findPerson } from '../../lib/expense.js'
import Avatar from '../Avatar/Avatar.jsx'
import ExpenseEditRow from '../ExpenseEditRow/ExpenseEditRow.jsx'
import './ExpenseList.css'

export default function ExpenseList({ state, dispatch, readOnly = false }) {
  const [editingId, setEditingId] = useState(null)
  const personOf = (id) => findPerson(state.people, id)

  return (
    <section className="expense-list-section panel">
      <h2>Expenses</h2>
      {state.expenses.length === 0 ? (
        <p className="empty">No expenses yet.</p>
      ) : (
        <ul className="expense-list">
          {state.expenses.map((exp) => {
            const participants = exp.participantIds.map((id) => personOf(id))
            return (
              <li key={exp.id} className="expense-item">
                {editingId === exp.id ? (
                  <ExpenseEditRow
                    expense={exp}
                    people={state.people}
                    onCancel={() => setEditingId(null)}
                    onSave={(fields) => {
                      dispatch({ type: 'UPDATE_EXPENSE', id: exp.id, ...fields })
                      setEditingId(null)
                    }}
                  />
                ) : (
                  <>
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
                        <span
                          className="avatar-stack"
                          role="group"
                          aria-label={`Split among ${participants
                            .map((p) => p.name)
                            .join(', ')}`}
                        >
                          {participants.map((p) => (
                            <Avatar key={p.id} person={p} size="sm" />
                          ))}
                        </span>
                      </span>
                      {!readOnly && (
                        <span className="expense-actions">
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => setEditingId(exp.id)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() =>
                              dispatch({ type: 'REMOVE_EXPENSE', id: exp.id })
                            }
                          >
                            Remove
                          </button>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
