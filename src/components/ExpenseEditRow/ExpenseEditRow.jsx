import { validateExpenseDraft } from '../../lib/expense.js'
import { useExpenseDraft } from '../../hooks/useExpenseDraft.js'
import ExpenseFields from '../ExpenseFields/ExpenseFields.jsx'
import './ExpenseEditRow.css'

// Inline editor for a single expense. Shares its state, validation, and field
// markup with the add form via useExpenseDraft + ExpenseFields. Calls onSave
// with the cleaned fields, or onCancel to discard.
export default function ExpenseEditRow({ expense, people, onSave, onCancel }) {
  const {
    values: draft,
    errors,
    setErrors,
    update,
    toggleParticipant,
  } = useExpenseDraft({
    description: expense.description,
    amount: String(expense.amount),
    paidById: expense.paidById,
    participantIds: expense.participantIds,
  })

  function save(e) {
    e.preventDefault()
    const { errors: next, cleaned } = validateExpenseDraft(draft)
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    onSave(cleaned)
  }

  return (
    <form className="expense-edit" onSubmit={save} noValidate>
      <ExpenseFields
        values={draft}
        errors={errors}
        people={people}
        onChange={update}
        onToggleParticipant={toggleParticipant}
        idPrefix={`edit-${expense.id}`}
      />
      <div className="expense-edit-actions">
        <button type="submit">Save changes</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
