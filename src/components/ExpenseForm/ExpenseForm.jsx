import { useEffect, useRef } from 'react'
import {
  EXPENSE_FIELDS,
  MIN_PEOPLE,
  peopleNeededHint,
  validateExpenseDraft,
} from '../../lib/expense.js'
import { useExpenseDraft } from '../../hooks/useExpenseDraft.js'
import ExpenseFields from '../ExpenseFields/ExpenseFields.jsx'
import './ExpenseForm.css'

const emptyForm = { description: '', amount: '', paidById: '', participantIds: [] }

const sameIds = (a, b) => a.length === b.length && a.every((id, i) => id === b[i])

export default function ExpenseForm({ state, dispatch }) {
  const {
    values: form,
    setValues: setForm,
    errors,
    setErrors,
    update,
    toggleParticipant,
  } = useExpenseDraft(emptyForm)
  // People we've already offered as checkboxes. Lets us auto-select brand-new
  // people while preserving any the user has explicitly unchecked.
  const seenPeople = useRef(new Set())
  const fieldRefs = {
    description: useRef(null),
    amount: useRef(null),
    paidById: useRef(null),
    participantIds: useRef(null),
  }

  useEffect(() => {
    // When everyone is removed (e.g. "Clear all data"), reset the form and any
    // validation errors so a fresh start doesn't reappear in an error state.
    if (state.people.length === 0) {
      setForm(emptyForm)
      setErrors({})
      seenPeople.current = new Set()
      return
    }
    const ids = new Set(state.people.map((p) => p.id))
    const fresh = state.people
      .filter((p) => !seenPeople.current.has(p.id))
      .map((p) => p.id)
    setForm((f) => {
      // Drop participants who were removed, append newly-added people.
      const next = [...f.participantIds.filter((id) => ids.has(id)), ...fresh]
      // Skip the update entirely if nothing changed, so we don't churn renders.
      if (sameIds(next, f.participantIds)) return f
      return { ...f, participantIds: next }
    })
    seenPeople.current = ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.people])

  function submit(e) {
    e.preventDefault()
    const { errors: nextErrors, cleaned } = validateExpenseDraft(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      // Move focus to the first invalid field for keyboard/AT users.
      const firstInvalid = EXPENSE_FIELDS.find((field) => nextErrors[field])
      fieldRefs[firstInvalid]?.current?.focus()
      return
    }

    dispatch({ type: 'ADD_EXPENSE', ...cleaned })
    // Reset, but keep everyone selected by default for the next expense.
    setForm({ ...emptyForm, participantIds: state.people.map((p) => p.id) })
  }

  if (state.people.length < MIN_PEOPLE) {
    return <p className="hint">{peopleNeededHint(state.people.length)}</p>
  }

  return (
    <form onSubmit={submit} className="expense-form panel" noValidate>
      <h2>Add expense</h2>
      <ExpenseFields
        values={form}
        errors={errors}
        people={state.people}
        onChange={update}
        onToggleParticipant={toggleParticipant}
        fieldRefs={fieldRefs}
        idPrefix="add"
      />
      <button type="submit">Add expense</button>
    </form>
  )
}
