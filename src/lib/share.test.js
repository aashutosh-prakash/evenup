import { describe, it, expect } from 'vitest'
import { buildSummaryText } from './share.js'

const state = {
  title: 'Goa Trip',
  people: [
    { id: 'p1', name: 'Aashutosh' },
    { id: 'p2', name: 'Pooja' },
  ],
  expenses: [
    {
      id: 'e1',
      description: 'Hotel',
      amount: 100,
      paidById: 'p1',
      participantIds: ['p1', 'p2'],
    },
  ],
}

describe('buildSummaryText', () => {
  it('shows paid totals with a total line, then arrow settlements (no expense list)', () => {
    const text = buildSummaryText(state)
    expect(text).toContain('EvenUp — Goa Trip')
    expect(text).toContain('Paid:')
    expect(text).toContain('• Aashutosh: 100.00')
    expect(text).toContain('• Pooja: 0.00')
    expect(text).toContain('Total expenses: 100.00')
    expect(text).toContain('Settle up:')
    expect(text).toContain('Pooja → Aashutosh: 50.00')
    // No per-expense list / heading anymore.
    expect(text).not.toContain('Expenses:')
    expect(text).not.toContain('Hotel')
    // Settlements use an arrow, not "pays".
    expect(text).not.toContain('pays')
  })

  it('handles the empty case', () => {
    const text = buildSummaryText({
      title: '',
      people: [{ id: 'p1', name: 'A' }],
      expenses: [],
    })
    expect(text).toContain('EvenUp summary')
    expect(text).toContain('Total expenses: 0.00')
    expect(text).toContain('• Everyone is settled')
  })
})
