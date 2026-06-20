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
  it('lists only people who paid, drops .00 on whole amounts, and uses arrows', () => {
    const text = buildSummaryText(state)
    expect(text).toContain('EvenKar — Goa Trip')
    expect(text).toContain('Paid:')
    expect(text).toContain('• Aashutosh: 100') // whole amount → no ".00"
    expect(text).not.toContain('100.00')
    expect(text).not.toContain('• Pooja: 0') // paid nothing → omitted from Paid
    expect(text).toContain('Total expenses: 100')
    expect(text).toContain('Settlements:')
    expect(text).toContain('Pooja → Aashutosh: 50') // still appears in settle-up
    // No per-expense list anymore.
    expect(text).not.toContain('Expenses:')
    expect(text).not.toContain('Hotel')
    expect(text).not.toContain('pays')
  })

  it('keeps 2 decimals for fractional amounts', () => {
    const text = buildSummaryText({
      title: '',
      people: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
        { id: 'p3', name: 'C' },
      ],
      expenses: [
        {
          id: 'e1',
          description: 'x',
          amount: 100,
          paidById: 'p1',
          participantIds: ['p1', 'p2', 'p3'],
        },
      ],
    })
    expect(text).toMatch(/→ A: 33\.3[34]/)
    expect(text).toContain('Total expenses: 100')
  })

  it('handles the empty case', () => {
    const text = buildSummaryText({
      title: '',
      people: [{ id: 'p1', name: 'A' }],
      expenses: [],
    })
    expect(text).toContain('EvenKar summary')
    expect(text).toContain('Total expenses: 0')
    expect(text).toContain('• Everyone is settled')
  })
})
