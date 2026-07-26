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
    const result = sanitizeAnalyticsUrl(`https://evenkar.vercel.app/#s=${payload}`, true)

    expect(result).not.toContain(payload)
    expect(result).not.toContain('#')
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

  it('labels a decoded share link as the shared page', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#s=abc', true)).toBe(
      `https://evenkar.vercel.app${SHARED_PATH}`,
    )
  })

  it('labels an undecodable share link as broken', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/#s=junk', false)).toBe(
      `https://evenkar.vercel.app${SHARED_BROKEN_PATH}`,
    )
  })

  it('preserves the query string while dropping the fragment', () => {
    expect(sanitizeAnalyticsUrl('https://evenkar.vercel.app/?ref=x#s=abc', true)).toBe(
      `https://evenkar.vercel.app${SHARED_PATH}?ref=x`,
    )
  })

  // Fail closed: this guard exists to keep the split out of the request. Anything
  // it can't fully reason about is refused rather than best-effort sanitized.
  it('refuses a non-string url instead of passing it through', () => {
    expect(sanitizeAnalyticsUrl(undefined)).toBe(null)
    expect(sanitizeAnalyticsUrl(123)).toBe(null)
    expect(sanitizeAnalyticsUrl('')).toBe(null)
  })

  it('refuses a url it cannot parse rather than partially rewriting it', () => {
    expect(sanitizeAnalyticsUrl('/#s=abc', true)).toBe(null)
    expect(sanitizeAnalyticsUrl('not a url at all', true)).toBe(null)
  })
})

describe('shareAnalyticsPath', () => {
  it('labels a share link that decoded as the shared page', () => {
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
    expect(shareAnalyticsPath('#s=', false)).toBe(null)
  })

  it('does not label an over-long payload as a share link', () => {
    expect(shareAnalyticsPath(`#s=${'a'.repeat(5000)}`, false)).toBe(null)
  })
})

describe('createBeforeSend', () => {
  it('labels each event from its OWN url, not from one captured at setup', () => {
    // The hook is built once per share-state transition but may see several
    // events. A share label must never be smeared onto an event whose url
    // carries no share payload.
    const beforeSend = createBeforeSend(true)

    expect(beforeSend({ url: 'https://evenkar.vercel.app/#s=abc' }).url).toBe(
      `https://evenkar.vercel.app${SHARED_PATH}`,
    )
    expect(beforeSend({ url: 'https://evenkar.vercel.app/' }).url).toBe(
      'https://evenkar.vercel.app/',
    )
    expect(beforeSend({ url: 'https://evenkar.vercel.app/?a=1' }).url).toBe(
      'https://evenkar.vercel.app/?a=1',
    )
  })

  it('carries the decode outcome into the label', () => {
    const broken = createBeforeSend(false)

    expect(broken({ url: 'https://evenkar.vercel.app/#s=junk' }).url).toBe(
      `https://evenkar.vercel.app${SHARED_BROKEN_PATH}`,
    )
  })

  it('keeps the event fields it does not own', () => {
    const beforeSend = createBeforeSend(false)
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/', extra: 1 }

    expect(beforeSend(event)).toEqual({
      type: 'pageview',
      url: 'https://evenkar.vercel.app/',
      extra: 1,
    })
  })

  it('does not mutate the event it was given', () => {
    const beforeSend = createBeforeSend(true)
    const event = { type: 'pageview', url: 'https://evenkar.vercel.app/#s=abc' }
    beforeSend(event)

    expect(event.url).toBe('https://evenkar.vercel.app/#s=abc')
  })

  it('drops an event whose url could not be sanitized', () => {
    const beforeSend = createBeforeSend(true)

    expect(beforeSend({ type: 'pageview', url: '/#s=abc' })).toBe(null)
    expect(beforeSend({ type: 'pageview' })).toBe(null)
  })

  it('drops a missing event', () => {
    expect(createBeforeSend(false)(null)).toBe(null)
  })
})
