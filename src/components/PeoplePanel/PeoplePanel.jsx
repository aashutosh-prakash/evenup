import { useEffect, useState } from 'react'
import { personInUse } from '../../state/store.js'
import { peopleNeededHint } from '../../lib/expense.js'
import Avatar from '../Avatar/Avatar.jsx'
import './PeoplePanel.css'

export default function PeoplePanel({ state, dispatch }) {
  const [name, setName] = useState('')
  const [notice, setNotice] = useState('')

  // Auto-dismiss the notice after a few seconds so it doesn't linger.
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(t)
  }, [notice])

  // Clear any stale notice once there are no people (e.g. after "Clear all").
  useEffect(() => {
    if (state.people.length === 0) setNotice('')
  }, [state.people.length])

  function addPerson(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return // block empty names
    dispatch({ type: 'ADD_PERSON', name: trimmed })
    setName('')
    setNotice('')
  }

  function removePerson(person) {
    // The reducer also refuses this, but check here for a friendly message.
    if (personInUse(state, person.id)) {
      setNotice(
        `Can't remove ${person.name} — they're part of one or more expenses. ` +
          `Remove or edit those expenses first.`,
      )
      return
    }
    setNotice('')
    dispatch({ type: 'REMOVE_PERSON', id: person.id })
  }

  return (
    <section className="people panel">
      <h2>People</h2>
      <form onSubmit={addPerson} className="row">
        <input
          type="text"
          name="new-person"
          value={name}
          placeholder="Add a person"
          aria-label="Add a person"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {notice && (
        <p className="field-error people-notice" role="alert">
          {notice}
        </p>
      )}
      <ul className="list">
        {state.people.map((p) => (
          <li key={p.id} className="row">
            <span className="person">
              <Avatar person={p} size="sm" />
              {p.name}
            </span>
            <button type="button" className="icon-btn" onClick={() => removePerson(p)}>
              ✕
            </button>
          </li>
        ))}
        {state.people.length === 0 && <li className="empty">{peopleNeededHint(0)}</li>}
      </ul>
    </section>
  )
}
