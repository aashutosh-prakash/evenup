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
  it('lists expenses (with payer + total), paid totals, and arrow settlements', () => {
    const text = buildSummaryText(state)
    expect(text).toContain('EvenUp — Goa Trip')
    expect(text).toContain('Expenses:')
    expect(text).toContain('• Hotel: 100.00 (paid by Aashutosh)')
    expect(text).toContain('Total: 100.00')
    expect(text).toContain('Paid:')
    expect(text).toContain('• Aashutosh: 100.00')
    expect(text).toContain('Settle up:')
    expect(text).toContain('Pooja → Aashutosh: 50.00')
    // No "pays" wording anymore — settlements use an arrow.
    expect(text).not.toContain('pays')
    // Everyone is included here, so no "excluded" note.
    expect(text).not.toContain('excluded')
  })

  it('notes who is excluded only when someone is left out', () => {
    const text = buildSummaryText({
      title: '',
      people: [
        { id: 'p1', name: 'Aashutosh' },
        { id: 'p2', name: 'Pooja' },
        { id: 'p3', name: 'Prinsa' },
      ],
      expenses: [
        {
          id: 'e1',
          description: 'Hotel',
          amount: 90,
          paidById: 'p1',
          participantIds: ['p1', 'p2', 'p3'],
        },
        {
          id: 'e2',
          description: 'Drinks',
          amount: 40,
          paidById: 'p2',
          participantIds: ['p1', 'p2'],
        },
      ],
    })
    // Everyone shares the hotel → no note.
    expect(text).toContain('• Hotel: 90.00 (paid by Aashutosh)')
    // Prinsa is left out of drinks → noted.
    expect(text).toContain('• Drinks: 40.00 (paid by Pooja, excluded: Prinsa)')
  })

  it('handles the empty case', () => {
    const text = buildSummaryText({
      title: '',
      people: [{ id: 'p1', name: 'A' }],
      expenses: [],
    })
    expect(text).toContain('EvenUp summary')
    expect(text).toContain('• No expenses yet')
    expect(text).toContain('• Everyone is settled')
  })
})
