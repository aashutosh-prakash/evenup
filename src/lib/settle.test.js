import { describe, it, expect } from 'vitest'
import { toCents, fromCents } from './settle.js'
import { computeBalances } from './settle.js'

describe('money helpers', () => {
  it('toCents rounds to nearest cent', () => {
    expect(toCents(120)).toBe(12000)
    expect(toCents(0.1)).toBe(10)
    expect(toCents(10.005)).toBe(1001) // rounds up
  })

  it('fromCents converts back to a 2-decimal number', () => {
    expect(fromCents(12000)).toBe(120)
    expect(fromCents(1001)).toBe(10.01)
  })
})

describe('computeBalances', () => {
  const people = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }]

  it('returns zero balances when there are no expenses', () => {
    expect(computeBalances(people, [])).toEqual({ a: 0, b: 0, c: 0 })
  })

  it('credits the payer and debits participants equally', () => {
    const expenses = [
      { id: 'e1', amount: 30, paidById: 'a', participantIds: ['a', 'b', 'c'] },
    ]
    expect(computeBalances(people, expenses)).toEqual({ a: 20, b: -10, c: -10 })
  })

  it('assigns the remainder penny deterministically by participant id order', () => {
    const expenses = [
      { id: 'e1', amount: 10, paidById: 'a', participantIds: ['c', 'b', 'a'] },
    ]
    const bal = computeBalances(people, expenses)
    expect(bal.a).toBeCloseTo(6.66, 2)
    expect(bal.b).toBeCloseTo(-3.33, 2)
    expect(bal.c).toBeCloseTo(-3.33, 2)
  })

  it('balances always sum to zero', () => {
    const expenses = [
      { id: 'e1', amount: 10, paidById: 'a', participantIds: ['a', 'b', 'c'] },
      { id: 'e2', amount: 7, paidById: 'b', participantIds: ['b', 'c'] },
    ]
    const bal = computeBalances(people, expenses)
    const sumCents = Object.values(bal).reduce((s, v) => s + Math.round(v * 100), 0)
    expect(sumCents).toBe(0)
  })
})
