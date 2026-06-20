import { describe, it, expect, beforeEach } from 'vitest'
import { reducer, nextColorIndex, loadState, saveState, newId } from './store.js'

const STORAGE_KEY = 'evenup.state'

describe('person color assignment', () => {
  it('gives each added person a distinct, sequential colorIndex', () => {
    let s = { people: [], expenses: [] }
    s = reducer(s, { type: 'ADD_PERSON', name: 'A' })
    s = reducer(s, { type: 'ADD_PERSON', name: 'B' })
    s = reducer(s, { type: 'ADD_PERSON', name: 'C' })
    const idxs = s.people.map((p) => p.colorIndex)
    expect(idxs).toEqual([0, 1, 2])
    expect(new Set(idxs).size).toBe(3)
  })

  it('reuses a freed index after a person is removed', () => {
    let s = { people: [], expenses: [] }
    s = reducer(s, { type: 'ADD_PERSON', name: 'A' }) // 0
    s = reducer(s, { type: 'ADD_PERSON', name: 'B' }) // 1
    const bId = s.people[1].id
    s = reducer(s, { type: 'ADD_PERSON', name: 'C' }) // 2
    s = reducer(s, { type: 'REMOVE_PERSON', id: bId }) // frees 1
    s = reducer(s, { type: 'ADD_PERSON', name: 'D' }) // should reuse 1
    expect(s.people.find((p) => p.name === 'D').colorIndex).toBe(1)
  })

  it('nextColorIndex skips indices already in use', () => {
    const people = [{ colorIndex: 0 }, { colorIndex: 2 }]
    expect(nextColorIndex(people)).toBe(1)
  })
})

describe('RENAME_PERSON', () => {
  it('changes the name while keeping id and colorIndex stable', () => {
    let s = { people: [], expenses: [] }
    s = reducer(s, { type: 'ADD_PERSON', name: 'Alice' })
    const { id, colorIndex } = s.people[0]
    s = reducer(s, { type: 'RENAME_PERSON', id, name: '  Alicia  ' })
    expect(s.people[0]).toEqual({ id, name: 'Alicia', colorIndex })
  })

  it('ignores an empty/whitespace name', () => {
    let s = { people: [], expenses: [] }
    s = reducer(s, { type: 'ADD_PERSON', name: 'Alice' })
    const before = s
    s = reducer(s, { type: 'RENAME_PERSON', id: s.people[0].id, name: '   ' })
    expect(s).toBe(before)
  })
})

describe('REMOVE_PERSON referential integrity', () => {
  it('removes a person who is not referenced by any expense', () => {
    let s = { people: [], expenses: [], title: '' }
    s = reducer(s, { type: 'ADD_PERSON', name: 'A' })
    const id = s.people[0].id
    s = reducer(s, { type: 'REMOVE_PERSON', id })
    expect(s.people).toHaveLength(0)
  })

  it('refuses to remove a person still referenced by an expense', () => {
    let s = { people: [], expenses: [], title: '' }
    s = reducer(s, { type: 'ADD_PERSON', name: 'A' })
    s = reducer(s, { type: 'ADD_PERSON', name: 'B' })
    const [a, b] = s.people.map((p) => p.id)
    s = reducer(s, {
      type: 'ADD_EXPENSE',
      description: 'Lunch',
      amount: 10,
      paidById: a,
      participantIds: [a, b],
    })
    const before = s
    s = reducer(s, { type: 'REMOVE_PERSON', id: a })
    // No-op: the reducer returns state unchanged, keeping balances reconcilable.
    expect(s).toBe(before)
    expect(s.people.map((p) => p.id)).toContain(a)
  })
})

describe('UPDATE_EXPENSE', () => {
  it('replaces the editable fields of the matching expense only', () => {
    let s = { people: [], expenses: [], title: '' }
    s = reducer(s, { type: 'ADD_PERSON', name: 'A' })
    s = reducer(s, { type: 'ADD_PERSON', name: 'B' })
    const [a, b] = s.people.map((p) => p.id)
    s = reducer(s, {
      type: 'ADD_EXPENSE',
      description: 'Lunch',
      amount: 10,
      paidById: a,
      participantIds: [a, b],
    })
    const id = s.expenses[0].id
    const createdAt = s.expenses[0].createdAt
    s = reducer(s, {
      type: 'UPDATE_EXPENSE',
      id,
      description: 'Dinner',
      amount: 42,
      paidById: b,
      participantIds: [b],
    })
    expect(s.expenses).toHaveLength(1)
    expect(s.expenses[0]).toMatchObject({
      id,
      description: 'Dinner',
      amount: 42,
      paidById: b,
      participantIds: [b],
      createdAt, // preserved, not part of the edit
    })
  })
})

describe('loadState sanitization', () => {
  beforeEach(() => localStorage.clear())

  it('returns the initial state when nothing is stored', () => {
    expect(loadState()).toEqual({ people: [], expenses: [], title: '' })
  })

  it('falls back to initial state on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadState()).toEqual({ people: [], expenses: [], title: '' })
  })

  it('coerces a non-numeric amount to 0 instead of keeping it', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        people: [{ id: 'a', name: 'A', colorIndex: 0 }],
        expenses: [{ id: 'e1', amount: 'oops', paidById: 'a', participantIds: ['a'] }],
        title: '',
      }),
    )
    const s = loadState()
    expect(s.expenses[0].amount).toBe(0)
  })

  it('drops malformed records and dangling participant references', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        people: [{ id: 'a', name: 'A' }, { name: 'no-id' }, null],
        expenses: [
          { id: 'e1', amount: 5, paidById: 'a', participantIds: ['a', 'ghost'] },
          { id: 'e2', amount: 5, participantIds: 'not-an-array' },
          'garbage',
        ],
        title: 'Trip',
      }),
    )
    const s = loadState()
    expect(s.people).toHaveLength(1)
    expect(s.expenses).toHaveLength(2)
    expect(s.expenses[0].participantIds).toEqual(['a']) // 'ghost' dropped
    expect(s.expenses[1].participantIds).toEqual([]) // non-array coerced
    expect(s.title).toBe('Trip')
  })
})

describe('saveState', () => {
  beforeEach(() => localStorage.clear())

  it('persists non-empty state and reports success', () => {
    const ok = saveState({
      people: [{ id: 'a', name: 'A', colorIndex: 0 }],
      expenses: [],
      title: '',
    })
    expect(ok).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('removes the storage key entirely when state is empty', () => {
    localStorage.setItem(STORAGE_KEY, '{"people":[],"expenses":[],"title":""}')
    saveState({ people: [], expenses: [], title: '' })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('newId', () => {
  it('produces unique ids', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId('p')))
    expect(ids.size).toBe(500)
  })
})
