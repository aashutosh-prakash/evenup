import {
  SHARED_BROKEN_PATH,
  SHARED_PATH,
  createBeforeSend,
  sanitizeAnalyticsUrl,
  shareAnalyticsPath,
} from './analytics.js'

describe('sanitizeAnalyticsUrl', () => {
  it('never leaks the encoded split out of a share-link URL', () => {
    const payload = 'NoIgxgFglgNhIC4QCEwEMoBMD2BXATgKZ4A2A5gK4B2ArgC4gA0IANCAKwAcAjA'
    const result = sanitizeAnalyticsUrl(`https://evenkar.vercel.app/#s=${payload}`)

    expect(result).not.toContain(payload)
    expect(result).not.toContain('#')
  })

  it('leaves a plain app URL untouched', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/')).toBe(
      'https://evenkar.vercel.app/',
    )
  })

  it('drops the fragment when no share path is given', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#settings')).toBe(
      'https://evenkar.vercel.app/',
    )
  })

  it('rewrites the path to the share path it is given', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#s=abc', SHARED_PATH)).toBe(
      `https://evenkar.vercel.app${SHARED_PATH}`,
    )
  })

  it('can report a broken share link as its own path', () => {
    expect(
      sanitizeAnalyticsUrl('https://evenkar.vercel.app/#s=junk', SHARED_BROKEN_PATH),
    ).toBe(`https://evenkar.vercel.app${SHARED_BROKEN_PATH}`)
  })

  it('preserves the query string while dropping the fragment', () => {
    expect(
      sanitizeAnalyticsUrl('https://evenkar.vercel.app/?ref=x#s=abc', SHARED_PATH),
    ).toBe(`https://evenkar.vercel.app${SHARED_PATH}?ref=x`)
  })

  it('strips a fragment from a non-absolute URL', () => {
    expect(sanitizeAnalyticsUrl('/#s=abc', SHARED_PATH)).toBe('/')
  })

  it('passes through a non-string url unchanged', () => {
    expect(sanitizeAnalyticsUrl(undefined)).toBe(undefined)
  })
})

describe('shareAnalyticsPath', () => {
  it('labels a share link that rendered as the shared page', () => {
    expect(shareAnalyticsPath('#s=abc', true)).toBe(SHARED_PATH)
  })

  it('labels a share link that failed to decode as broken', () => {
    expect(shareAnalyticsPath('#s=junk', false)).toBe(SHARED_BROKEN_PATH)
  })

  it('does not label a visit that carried no share link', () => {
    expect(shareAnalyticsPath('', false)).toBe(null)
    expect(shareAnalyticsPath('#other=1', false)).toBe(null)
  })

  it('does not label an empty s= as a share link at all', () => {
    // Nothing was actually shared, so this is neither a view nor a broken link.
    expect(shareAnalyticsPath('#s=', false)).toBe(null)
  })

  it('does not label an over-long payload as a share link', () => {
    expect(shareAnalyticsPath(`#s=${'a'.repeat(5000)}`, false)).toBe(null)
  })
})

describe('createBeforeSend', () => {
  it('sanitizes the url of an outgoing event', () => {
    const beforeSend = createBeforeSend(SHARED_PATH)
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/#s=abc' }

    expect(beforeSend(event).url).toBe(`https://evenkar.vercel.app${SHARED_PATH}`)
  })

  it('reports a broken share link under the broken path', () => {
    const beforeSend = createBeforeSend(SHARED_BROKEN_PATH)
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/#s=junk' }

    expect(beforeSend(event).url).toBe(`https://evenkar.vercel.app${SHARED_BROKEN_PATH}`)
  })

  it('keeps the event fields it does not own', () => {
    const beforeSend = createBeforeSend(null)
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/', extra: 1 }

    expect(beforeSend(event)).toEqual({
      type: 'pageview',
      url: 'https://evenkar.vercel.app/',
      extra: 1,
    })
  })

  it('does not mutate the event it was given', () => {
    const beforeSend = createBeforeSend(SHARED_PATH)
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/#s=abc' }
    beforeSend(event)

    expect(event.url).toBe('https://evenkar.vercel.app/#s=abc')
  })

  it('tolerates a missing event', () => {
    expect(createBeforeSend(null)(null)).toBe(null)
  })
})
