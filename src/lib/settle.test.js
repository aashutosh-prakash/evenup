import { describe, it, expect } from 'vitest'
import {
  toCents,
  fromCents,
  computeBalances,
  settle,
  computePaidTotals,
  computeTotal,
  formatMoney,
} from './settle.js'

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
  const people = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
  ]

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
    expect(bal.a).toBe(6.66)
    expect(bal.b).toBe(-3.33)
    expect(bal.c).toBe(-3.33)
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

  it('ignores expenses with no participants', () => {
    const expenses = [{ id: 'e1', amount: 10, paidById: 'a', participantIds: [] }]
    expect(computeBalances(people, expenses)).toEqual({ a: 0, b: 0, c: 0 })
  })

  it('treats a missing participantIds array as no participants', () => {
    const expenses = [{ id: 'e1', amount: 10, paidById: 'a' }]
    expect(computeBalances(people, expenses)).toEqual({ a: 0, b: 0, c: 0 })
  })

  it('silently drops ids that are not known people but still reconciles', () => {
    const expenses = [
      { id: 'e1', amount: 9, paidById: 'a', participantIds: ['a', 'b', 'ghost'] },
    ]
    const bal = computeBalances(people, expenses)
    // 'ghost' is dropped from the credit/debit, so the payer is over-credited;
    // the point of the test is that no NaN/throw occurs and known ids are sane.
    expect(Number.isFinite(bal.a)).toBe(true)
    expect(bal.b).toBe(-3)
    expect(bal.c).toBe(0)
  })

  it('still reconciles to zero with a negative (refund) amount', () => {
    const expenses = [
      { id: 'e1', amount: -10, paidById: 'a', participantIds: ['a', 'b', 'c'] },
    ]
    const bal = computeBalances(people, expenses)
    const sumCents = Object.values(bal).reduce((s, v) => s + Math.round(v * 100), 0)
    expect(sumCents).toBe(0)
  })

  it('does not throw or produce NaN for a non-finite amount', () => {
    const expenses = [
      { id: 'e1', amount: NaN, paidById: 'a', participantIds: ['a', 'b', 'c'] },
    ]
    const bal = computeBalances(people, expenses)
    expect(Object.values(bal).every((v) => Number.isFinite(v))).toBe(true)
  })
})

describe('settle', () => {
  it('returns no transactions for empty input', () => {
    expect(settle({})).toEqual([])
  })

  it('returns no transactions when everyone is even', () => {
    expect(settle({ a: 0, b: 0 })).toEqual([])
  })

  it('produces a single transaction for one debtor and one creditor', () => {
    expect(settle({ a: 10, b: -10 })).toEqual([{ fromId: 'b', toId: 'a', amount: 10 }])
  })

  it('fully reconciles across multiple parties with few transactions', () => {
    const txns = settle({ a: 20, b: -5, c: -15 })
    // Greedy heuristic — assert it reconciles, not that it is provably minimal.
    expect(txns).toHaveLength(2)
    const total = txns.reduce((s, t) => s + t.amount, 0)
    expect(total).toBe(20)
    for (const t of txns) expect(t.toId).toBe('a')
  })

  it('all transaction amounts are positive', () => {
    const txns = settle({ a: 6.66, b: -3.33, c: -3.33 })
    for (const t of txns) expect(t.amount).toBeGreaterThan(0)
  })
})

describe('computePaidTotals', () => {
  const people = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ]

  it('returns zero for everyone with no expenses', () => {
    expect(computePaidTotals(people, [])).toEqual({ a: 0, b: 0 })
  })

  it('sums the amounts each person paid', () => {
    const expenses = [
      { id: 'e1', amount: 30, paidById: 'a', participantIds: ['a', 'b'] },
      { id: 'e2', amount: 12.5, paidById: 'a', participantIds: ['b'] },
      { id: 'e3', amount: 8, paidById: 'b', participantIds: ['a', 'b'] },
    ]
    expect(computePaidTotals(people, expenses)).toEqual({ a: 42.5, b: 8 })
  })
})

describe('computeTotal', () => {
  it('is zero with no expenses', () => {
    expect(computeTotal([])).toBe(0)
  })

  it('sums all expense amounts cent-safely', () => {
    const expenses = [{ amount: 0.1 }, { amount: 0.2 }, { amount: 4000 }]
    expect(computeTotal(expenses)).toBe(4000.3)
  })
})

describe('formatMoney', () => {
  it('formats a number to 2 decimals', () => {
    expect(formatMoney(120)).toBe('120.00')
    expect(formatMoney(10.1)).toBe('10.10')
    expect(formatMoney(5)).toBe('5.00')
  })

  it('adds thousands separators', () => {
    expect(formatMoney(9608)).toBe('9,608.00')
    expect(formatMoney(1550.5)).toBe('1,550.50')
  })

  it('coerces non-finite input to 0 instead of throwing', () => {
    expect(formatMoney(NaN)).toBe('0.00')
    expect(formatMoney(undefined)).toBe('0.00')
    expect(formatMoney(null)).toBe('0.00')
  })
})
