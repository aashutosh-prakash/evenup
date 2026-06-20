import { afterEach, vi } from 'vitest'
import LZString from 'lz-string'
import {
  encodeSplit,
  decodeSplit,
  buildShareUrl,
  composeShareUrl,
  readSharedFromHash,
  shareLink,
  MAX_URL_LENGTH,
} from './share-link.js'

// Hand-craft a wire string directly from a raw payload (bypassing encodeSplit)
// to exercise decodeSplit against malicious/malformed input.
const craft = (payload) => LZString.compressToEncodedURIComponent(JSON.stringify(payload))

const sample = {
  title: 'Goa Trip',
  people: [
    { id: 'p_a', name: 'Aashutosh', colorIndex: 0 },
    { id: 'p_b', name: 'Pooja', colorIndex: 2 },
    { id: 'p_c', name: 'Ravi', colorIndex: 5 },
  ],
  expenses: [
    {
      id: 'e1',
      description: 'Hotel',
      amount: 120.5,
      paidById: 'p_a',
      participantIds: ['p_a', 'p_b', 'p_c'],
      createdAt: 1700000000000,
    },
    {
      id: 'e2',
      description: 'Cab',
      amount: 60,
      paidById: 'p_b',
      participantIds: ['p_a', 'p_b'],
      createdAt: 1700000001000,
    },
  ],
}

describe('encodeSplit / decodeSplit round-trip', () => {
  it('preserves title, names, colorIndex, amounts and relationships', () => {
    const decoded = decodeSplit(encodeSplit(sample))
    expect(decoded).not.toBeNull()

    expect(decoded.title).toBe('Goa Trip')
    expect(decoded.people.map((p) => p.name)).toEqual(['Aashutosh', 'Pooja', 'Ravi'])
    expect(decoded.people.map((p) => p.colorIndex)).toEqual([0, 2, 5])

    // ids are regenerated, so assert by structure/relationships (by name).
    const nameOf = (id) => decoded.people.find((p) => p.id === id).name

    expect(decoded.expenses).toHaveLength(2)
    const hotel = decoded.expenses[0]
    expect(hotel.description).toBe('Hotel')
    expect(hotel.amount).toBe(120.5)
    expect(nameOf(hotel.paidById)).toBe('Aashutosh')
    expect(hotel.participantIds.map(nameOf)).toEqual(['Aashutosh', 'Pooja', 'Ravi'])
    expect(hotel.createdAt).toBe(0)

    const cab = decoded.expenses[1]
    expect(cab.description).toBe('Cab')
    expect(cab.amount).toBe(60)
    expect(nameOf(cab.paidById)).toBe('Pooja')
    expect(cab.participantIds.map(nameOf)).toEqual(['Aashutosh', 'Pooja'])
  })

  it('regenerates fresh, unique ids (not the originals)', () => {
    const decoded = decodeSplit(encodeSplit(sample))
    const ids = decoded.people.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).not.toContain('p_a')
    expect(decoded.expenses.map((e) => e.id)).not.toContain('e1')
  })

  it('round-trips Unicode names and emoji', () => {
    const state = {
      title: 'Café ☕ Münchën',
      people: [
        { id: 'p1', name: 'José 🌮', colorIndex: 1 },
        { id: 'p2', name: '日本語', colorIndex: 3 },
      ],
      expenses: [
        {
          id: 'e1',
          description: 'Lunch 🍜',
          amount: 42,
          paidById: 'p1',
          participantIds: ['p1', 'p2'],
          createdAt: 0,
        },
      ],
    }
    const decoded = decodeSplit(encodeSplit(state))
    expect(decoded.title).toBe('Café ☕ Münchën')
    expect(decoded.people.map((p) => p.name)).toEqual(['José 🌮', '日本語'])
    expect(decoded.expenses[0].description).toBe('Lunch 🍜')
  })
})

describe('shared timestamp', () => {
  it('round-trips a sharedAt passed at encode time', () => {
    const decoded = decodeSplit(encodeSplit(sample, 1700000000000))
    expect(decoded.sharedAt).toBe(1700000000000)
  })

  it('is null when no timestamp was embedded', () => {
    expect(decodeSplit(encodeSplit(sample)).sharedAt).toBeNull()
  })

  it('composeShareUrl embeds the current time by default', () => {
    const url = composeShareUrl(sample, 'https://e.com')
    const decoded = readSharedFromHash(url.slice(url.indexOf('#')))
    expect(typeof decoded.sharedAt).toBe('number')
  })
})

describe('decodeSplit defensive handling', () => {
  it('returns null on garbage input', () => {
    expect(decodeSplit('!!!')).toBeNull()
    expect(decodeSplit('')).toBeNull()
    expect(decodeSplit('eyJ')).toBeNull() // truncated base64 of '{...'
    expect(decodeSplit(null)).toBeNull()
    expect(decodeSplit(undefined)).toBeNull()
  })

  it('clears an out-of-range or missing payer index to an empty paidById', () => {
    const decoded = decodeSplit(
      encodeSplit({
        title: '',
        people: [{ id: 'p1', name: 'A', colorIndex: 0 }],
        // No payer (paidById missing) -> payerIndex -1 -> paidById ''.
        expenses: [
          {
            id: 'e1',
            description: 'x',
            amount: 10,
            paidById: '',
            participantIds: ['p1'],
            createdAt: 0,
          },
        ],
      }),
    )
    expect(decoded.expenses[0].paidById).toBe('')
  })

  it('drops out-of-range participant indices', () => {
    // Two valid people; expense references index 5 which does not exist.
    const decoded = decodeSplit(
      craft({
        p: [
          { n: 'A', c: 0 },
          { n: 'B', c: 1 },
        ],
        e: [{ a: 10, p: 0, s: [0, 5, 1] }],
      }),
    )
    const names = (ids) => ids.map((id) => decoded.people.find((p) => p.id === id).name)
    expect(names(decoded.expenses[0].participantIds)).toEqual(['A', 'B'])
  })

  it('de-dupes repeated participant indices (so a person is not charged twice)', () => {
    const decoded = decodeSplit(
      craft({
        p: [
          { n: 'A', c: 0 },
          { n: 'B', c: 1 },
        ],
        e: [{ a: 10, p: 0, s: [0, 1, 1, 0] }],
      }),
    )
    expect(decoded.expenses[0].participantIds).toHaveLength(2)
    expect(new Set(decoded.expenses[0].participantIds).size).toBe(2)
  })

  it('returns null for an empty split (so a blank link cannot wipe data)', () => {
    expect(decodeSplit(craft({}))).toBeNull()
    expect(decodeSplit(craft({ p: [], e: [] }))).toBeNull()
  })

  it('never copies a polluting field from the payload', () => {
    const decoded = decodeSplit(encodeSplit(sample))
    // Built explicitly: only the known keys exist on each record.
    expect(Object.keys(decoded.people[0]).sort()).toEqual(['colorIndex', 'id', 'name'])
    expect(Object.keys(decoded.expenses[0]).sort()).toEqual([
      'amount',
      'createdAt',
      'description',
      'id',
      'paidById',
      'participantIds',
    ])
  })
})

describe('buildShareUrl', () => {
  it('builds a hash URL with the encoded split', () => {
    const url = buildShareUrl(sample, 'https://example.com')
    expect(url).not.toBeNull()
    expect(url.startsWith('https://example.com/#s=')).toBe(true)
    // Round-trips back through the hash reader.
    const decoded = readSharedFromHash(url.slice(url.indexOf('#')))
    expect(decoded.title).toBe('Goa Trip')
  })

  it('returns null for an empty split (no people and no expenses)', () => {
    expect(
      buildShareUrl({ title: 'x', people: [], expenses: [] }, 'https://e.com'),
    ).toBeNull()
  })

  it('returns null when the URL exceeds MAX_URL_LENGTH', () => {
    // Many people with long names blows past the limit.
    const people = Array.from({ length: 400 }, (_, i) => ({
      id: `p${i}`,
      name: `Person-with-a-very-long-name-number-${i}`,
      colorIndex: i,
    }))
    const big = { title: 'Huge', people, expenses: [] }
    const url = buildShareUrl(big, 'https://example.com')
    expect(url).toBeNull()
    // Guard the construction actually exceeds the cap.
    expect(`https://example.com/#s=${encodeSplit(big)}`.length).toBeGreaterThan(
      MAX_URL_LENGTH,
    )
  })
})

describe('composeShareUrl', () => {
  it('returns a verified URL when the split round-trips', () => {
    const url = composeShareUrl(sample, 'https://example.com')
    expect(url).not.toBeNull()
    expect(url.startsWith('https://example.com/#s=')).toBe(true)
  })

  it('returns null for an empty split (caller falls back to text)', () => {
    expect(
      composeShareUrl({ title: '', people: [], expenses: [] }, 'https://e.com'),
    ).toBeNull()
  })

  it('returns null when too large to encode', () => {
    const people = Array.from({ length: 400 }, (_, i) => ({
      id: `p${i}`,
      name: `Person-with-a-very-long-name-number-${i}`,
      colorIndex: i,
    }))
    expect(
      composeShareUrl({ title: 'Huge', people, expenses: [] }, 'https://e.com'),
    ).toBeNull()
  })
})

describe('shareLink', () => {
  afterEach(() => {
    delete navigator.share
    delete navigator.clipboard
  })

  it('copies the heading, a blank line, then the link', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    const result = await shareLink('https://e.com/#s=abc', 'EvenKar — Goa Trip')
    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('EvenKar — Goa Trip\n\nhttps://e.com/#s=abc')
  })

  it('shares the same composed message via the native sheet', async () => {
    const share = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    const result = await shareLink('https://e.com/#s=abc', 'EvenKar — Goa Trip')
    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith({
      text: 'EvenKar — Goa Trip\n\nhttps://e.com/#s=abc',
    })
  })
})

describe('readSharedFromHash', () => {
  it('reads the s param out of a #s=... hash', () => {
    const encoded = encodeSplit(sample)
    const decoded = readSharedFromHash(`#s=${encoded}`)
    expect(decoded).not.toBeNull()
    expect(decoded.people.map((p) => p.name)).toEqual(['Aashutosh', 'Pooja', 'Ravi'])
  })

  it('returns null when there is no s param', () => {
    expect(readSharedFromHash('')).toBeNull()
    expect(readSharedFromHash('#')).toBeNull()
    expect(readSharedFromHash('#other=1')).toBeNull()
  })
})
