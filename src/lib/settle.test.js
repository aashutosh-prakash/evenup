import { describe, it, expect } from 'vitest'
import { toCents, fromCents } from './settle.js'

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
