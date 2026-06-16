import { useState } from 'react'
import { personInUse } from '../state/store.js'

export default function PeoplePanel({ state, dispatch }) {
  const [name, setName] = useState('')

  function addPerson(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return // block empty names
    dispatch({ type: 'ADD_PERSON', name: trimmed })
    setName('')
  }

  function removePerson(person) {
    if (personInUse(state, person.id)) {
      alert(
        `Can't remove ${person.name} — they're part of one or more expenses. ` +
          `Remove or edit those expenses first.`,
      )
      return
    }
    dispatch({ type: 'REMOVE_PERSON', id: person.id })
  }

  return (
    <section className="people panel">
      <h2>People</h2>
      <form onSubmit={addPerson} className="row">
        <input
          type="text"
          value={name}
          placeholder="Add a person"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      <ul className="list">
        {state.people.map((p) => (
          <li key={p.id} className="row">
            <span>{p.name}</span>
            <button type="button" onClick={() => removePerson(p)}>
              ✕
            </button>
          </li>
        ))}
        {state.people.length === 0 && <li className="empty">No people yet.</li>}
      </ul>
    </section>
  )
}
