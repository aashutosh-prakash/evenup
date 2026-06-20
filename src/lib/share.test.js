import { describe, it, expect, afterEach, vi } from 'vitest'
import { buildSummaryText, shareSummary } from './share.js'

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

describe('shareSummary', () => {
  afterEach(() => {
    delete navigator.share
    delete navigator.clipboard
  })

  it('uses the native share sheet when available', async () => {
    const share = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    expect(await shareSummary('hello')).toBe('shared')
    expect(share).toHaveBeenCalledWith({ text: 'hello' })
  })

  it('falls back to the clipboard when share is unavailable', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    expect(await shareSummary('hello')).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it("returns 'cancelled' when the user dismisses the share sheet", async () => {
    const err = new Error('dismissed')
    err.name = 'AbortError'
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(() => Promise.reject(err)),
      configurable: true,
    })
    expect(await shareSummary('hello')).toBe('cancelled')
  })

  it("returns 'failed' when the clipboard write throws", async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(() => Promise.reject(new Error('blocked'))) },
      configurable: true,
    })
    expect(await shareSummary('hello')).toBe('failed')
  })
})
