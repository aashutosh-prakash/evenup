import { useState } from 'react'
import { formatMoney } from '../../lib/settle.js'
import { personOf as findPerson } from '../../lib/expense.js'
import Avatar from '../Avatar/Avatar.jsx'
import ExpenseEditRow from '../ExpenseEditRow/ExpenseEditRow.jsx'
import './ExpenseList.css'

export default function ExpenseList({ state, dispatch }) {
  const [editingId, setEditingId] = useState(null)
  // Which expense's Remove is awaiting confirmation (only one at a time).
  const [confirmingId, setConfirmingId] = useState(null)
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
                    {confirmingId === exp.id ? (
                      // Swap only the meta row for the confirm bar: the row keeps
                      // the same width and height, so the list below never shifts.
                      <div
                        className="expense-meta expense-confirm"
                        role="alertdialog"
                        aria-label="Confirm removal"
                      >
                        <span className="expense-confirm-text">
                          Remove <strong>{exp.description || 'this expense'}</strong>?
                        </span>
                        <span className="expense-confirm-actions">
                          <button
                            type="button"
                            className="link-btn"
                            // Clicking Remove unmounts its button; move focus to
                            // the safe (Cancel) action so keyboard/AT users land
                            // inside the prompt instead of at document.body.
                            autoFocus
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => {
                              dispatch({ type: 'REMOVE_EXPENSE', id: exp.id })
                              setConfirmingId(null)
                            }}
                          >
                            Remove
                          </button>
                        </span>
                      </div>
                    ) : (
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
                        <span className="expense-actions">
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => {
                              setConfirmingId(null)
                              setEditingId(exp.id)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => setConfirmingId(exp.id)}
                          >
                            Remove
                          </button>
                        </span>
                      </div>
                    )}
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
