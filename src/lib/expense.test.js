import { describe, it, expect } from 'vitest'
import {
  MIN_PEOPLE,
  peopleNeededHint,
  personOf,
  validateExpenseDraft,
} from './expense.js'

describe('validateExpenseDraft', () => {
  const valid = {
    description: ' Lunch ',
    amount: '20',
    paidById: 'p1',
    participantIds: ['p1'],
  }

  it('accepts a valid draft and returns trimmed, numeric cleaned fields', () => {
    const { errors, cleaned } = validateExpenseDraft(valid)
    expect(errors).toEqual({})
    expect(cleaned).toEqual({
      description: 'Lunch',
      amount: 20,
      paidById: 'p1',
      participantIds: ['p1'],
    })
  })

  it('flags each missing/invalid field', () => {
    const { errors } = validateExpenseDraft({
      description: '  ',
      amount: '0',
      paidById: '',
      participantIds: [],
    })
    expect(Object.keys(errors).sort()).toEqual(
      ['amount', 'description', 'paidById', 'participantIds'].sort(),
    )
  })

  it('rejects non-numeric amounts', () => {
    const { errors } = validateExpenseDraft({ ...valid, amount: 'abc' })
    expect(errors.amount).toBeTruthy()
  })
})

describe('peopleNeededHint', () => {
  it('returns guidance below the threshold and nothing at/above it', () => {
    expect(peopleNeededHint(0)).toMatch(/at least 2/i)
    expect(peopleNeededHint(1)).toMatch(/one more/i)
    expect(peopleNeededHint(MIN_PEOPLE)).toBe('')
    expect(peopleNeededHint(5)).toBe('')
  })
})

describe('personOf', () => {
  const people = [{ id: 'p1', name: 'Alice' }]

  it('finds a known person', () => {
    expect(personOf(people, 'p1')).toEqual({ id: 'p1', name: 'Alice' })
  })

  it('falls back to a (removed) placeholder for unknown ids', () => {
    expect(personOf(people, 'ghost')).toEqual({ id: 'ghost', name: '(removed)' })
  })
})
