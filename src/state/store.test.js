import { describe, it, expect } from 'vitest'
import { reducer, nextColorIndex } from './store.js'

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
