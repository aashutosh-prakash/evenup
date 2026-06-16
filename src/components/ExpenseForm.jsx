import { useState } from 'react'

const emptyForm = { description: '', amount: '', paidById: '', participantIds: [] }

export default function ExpenseForm({ state, dispatch }) {
  const [form, setForm] = useState(emptyForm)

  function toggleParticipant(id) {
    setForm((f) => ({
      ...f,
      participantIds: f.participantIds.includes(id)
        ? f.participantIds.filter((p) => p !== id)
        : [...f.participantIds, id],
    }))
  }

  function submit(e) {
    e.preventDefault()
    const description = form.description.trim()
    const amount = Number(form.amount)
    if (!description) return alert('Enter a description.')
    if (!(amount > 0)) return alert('Enter an amount greater than 0.')
    if (!form.paidById) return alert('Select who paid.')
    if (form.participantIds.length === 0) return alert('Select at least one participant.')

    dispatch({
      type: 'ADD_EXPENSE',
      description,
      amount,
      paidById: form.paidById,
      participantIds: form.participantIds,
    })
    setForm(emptyForm)
  }

  if (state.people.length === 0) {
    return <p className="hint">Add people before adding expenses.</p>
  }

  return (
    <form onSubmit={submit} className="expense-form panel">
      <h2>Add expense</h2>
      <input
        type="text"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Amount"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />
      <label>
        Paid by:
        <select
          value={form.paidById}
          onChange={(e) => setForm({ ...form, paidById: e.target.value })}
        >
          <option value="">— select —</option>
          {state.people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Split among</legend>
        {state.people.map((p) => (
          <label key={p.id} className="check">
            <input
              type="checkbox"
              checked={form.participantIds.includes(p.id)}
              onChange={() => toggleParticipant(p.id)}
            />
            {p.name}
          </label>
        ))}
      </fieldset>
      <button type="submit">Add expense</button>
    </form>
  )
}
