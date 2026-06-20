import { useEffect, useState } from 'react'
import { personInUse } from '../../state/store.js'
import { peopleNeededHint } from '../../lib/expense.js'
import Avatar from '../Avatar/Avatar.jsx'
import './PeoplePanel.css'

export default function PeoplePanel({ state, dispatch }) {
  const [name, setName] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

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

  function startEdit(person) {
    setNotice('')
    setEditingId(person.id)
    setEditName(person.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  function saveEdit(e) {
    e.preventDefault()
    const trimmed = editName.trim()
    // Empty isn't a valid name; just leave edit mode without changing anything.
    if (trimmed) dispatch({ type: 'RENAME_PERSON', id: editingId, name: trimmed })
    cancelEdit()
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
      <h2>Members</h2>
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
        {state.people.map((p) =>
          editingId === p.id ? (
            <li key={p.id} className="row">
              <form className="person-edit" onSubmit={saveEdit}>
                <Avatar person={p} size="sm" />
                <input
                  type="text"
                  className="rename-input"
                  value={editName}
                  aria-label={`Edit name for ${p.name}`}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelEdit()
                  }}
                />
                <span className="row-actions">
                  <button type="submit" className="icon-btn save" aria-label="Save name">
                    ✓
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Cancel edit"
                    onClick={cancelEdit}
                  >
                    ✕
                  </button>
                </span>
              </form>
            </li>
          ) : (
            <li key={p.id} className="row">
              <span className="person">
                <Avatar person={p} size="sm" />
                <span className="person-name">{p.name}</span>
              </span>
              <span className="row-actions">
                <button
                  type="button"
                  className="icon-btn rename"
                  aria-label={`Rename ${p.name}`}
                  onClick={() => startEdit(p)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => removePerson(p)}
                >
                  ✕
                </button>
              </span>
            </li>
          ),
        )}
        {state.people.length === 0 && <li className="empty">{peopleNeededHint(0)}</li>}
      </ul>
    </section>
  )
}
