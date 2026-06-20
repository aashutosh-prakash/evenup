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

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'

function setPersisted(value) {
  Object.defineProperty(navigator, 'storage', {
    value: { persisted: vi.fn().mockResolvedValue(value) },
    configurable: true,
  })
}

describe('isStorageEvictionRisk', () => {
  it('is true on a non-installed iOS browser whose storage is not persisted', async () => {
    setUserAgent(IOS_UA)
    setPersisted(false)
    expect(await isStorageEvictionRisk()).toBe(true)
  })

  it('is true on iOS when the Storage API is unavailable', async () => {
    setUserAgent(IOS_UA)
    expect(await isStorageEvictionRisk()).toBe(true)
  })

  it('is false on iOS once storage is actually persisted', async () => {
    setUserAgent(IOS_UA)
    setPersisted(true)
    expect(await isStorageEvictionRisk()).toBe(false)
  })

  it('is false once installed (standalone)', async () => {
    setUserAgent(IOS_UA)
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    expect(await isStorageEvictionRisk()).toBe(false)
  })

  it('is false on a non-WebKit browser regardless of persisted state', async () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36')
    setVendor('Google Inc.')
    setPersisted(false)
    expect(await isStorageEvictionRisk()).toBe(false)
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
