import { SHARED_PATH, beforeSend, sanitizeAnalyticsUrl } from './analytics.js'

describe('sanitizeAnalyticsUrl', () => {
  it('never leaks the encoded split out of a share-link URL', () => {
    const payload = 'NoIgxgFglgNhIC4QCEwEMoBMD2BXATgKZ4A2A5gK4B2ArgC4gA0IANCAKwAcAjA'
    const result = sanitizeAnalyticsUrl(`https://evenkar.vercel.app/#s=${payload}`)

    expect(result).not.toContain(payload)
    expect(result).not.toContain('#')
  })

  it('reports a share-link visit as its own page path', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#s=abc123')).toBe(
      `https://evenkar.vercel.app${SHARED_PATH}`,
    )
  })

  it('leaves a plain app URL untouched', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/')).toBe(
      'https://evenkar.vercel.app/',
    )
  })

  it('drops a fragment that is not a share link', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#settings')).toBe(
      'https://evenkar.vercel.app/',
    )
  })

  it('does not count an empty s= as a share-link visit', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#s=')).toBe(
      'https://evenkar.vercel.app/',
    )
  })

  it('finds the s param when it is not the first in the fragment', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#x=1&s=abc')).toBe(
      `https://evenkar.vercel.app${SHARED_PATH}`,
    )
  })

  it('does not mistake a param merely ending in s for the share param', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#xs=abc')).toBe(
      'https://evenkar.vercel.app/',
    )
  })

  it('ignores an implausibly long payload rather than reporting a visit', () => {
    const huge = 'a'.repeat(5000)
    expect(sanitizeAnalyticsUrl(`https://evenkar.vercel.app/#s=${huge}`)).toBe(
      'https://evenkar.vercel.app/',
    )
  })

  it('preserves the query string while dropping the fragment', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/?ref=x#s=abc')).toBe(
      `https://evenkar.vercel.app${SHARED_PATH}?ref=x`,
    )
  })

  it('strips a fragment from a non-absolute URL', () => {
    expect(sanitizeAnalyticsUrl('/#s=abc')).toBe('/')
  })

  it('passes through a non-string url unchanged', () => {
    expect(sanitizeAnalyticsUrl(undefined)).toBe(undefined)
  })
})

describe('beforeSend', () => {
  it('sanitizes the url of an outgoing event', () => {
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/#s=abc' }

    expect(beforeSend(event).url).toBe(`https://evenkar.vercel.app${SHARED_PATH}`)
  })

  it('keeps the event fields it does not own', () => {
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/', extra: 1 }

    expect(beforeSend(event)).toEqual({
      type: 'pageview',
      url: 'https://evenkar.vercel.app/',
      extra: 1,
    })
  })

  it('does not mutate the event it was given', () => {
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/#s=abc' }
    beforeSend(event)

    expect(event.url).toBe('https://evenkar.vercel.app/#s=abc')
  })

  it('tolerates a missing event', () => {
    expect(beforeSend(null)).toBe(null)
  })
})
