import { describe, it, expect, afterEach, vi } from 'vitest'
import { isStorageEvictionRisk, requestPersistentStorage } from './platform.js'

const realUserAgent = window.navigator.userAgent
const realVendor = window.navigator.vendor

function setUserAgent(value) {
  Object.defineProperty(window.navigator, 'userAgent', { value, configurable: true })
}
function setVendor(value) {
  Object.defineProperty(window.navigator, 'vendor', { value, configurable: true })
}

afterEach(() => {
  setUserAgent(realUserAgent)
  setVendor(realVendor)
  delete window.matchMedia
  delete navigator.storage
})

describe('isStorageEvictionRisk', () => {
  it('is true on a non-installed iOS browser (WebKit)', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    )
    expect(isStorageEvictionRisk()).toBe(true)
  })

  it('is false once installed (standalone)', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    )
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    expect(isStorageEvictionRisk()).toBe(false)
  })

  it('is false on a non-WebKit browser', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36')
    setVendor('Google Inc.')
    expect(isStorageEvictionRisk()).toBe(false)
  })
})

describe('requestPersistentStorage', () => {
  it('resolves false when the Storage API is unavailable', async () => {
    expect(await requestPersistentStorage()).toBe(false)
  })

  it('requests persistence only when not already persisted', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    Object.defineProperty(navigator, 'storage', {
      value: { persist, persisted: vi.fn().mockResolvedValue(false) },
      configurable: true,
    })
    expect(await requestPersistentStorage()).toBe(true)
    expect(persist).toHaveBeenCalledOnce()
  })
})
