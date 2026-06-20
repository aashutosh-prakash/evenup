import { describe, it, expect, afterEach, vi } from 'vitest'
import { isStorageEvictionRisk, requestPersistentStorage } from './platform.js'

// Mock the StorageManager. A real browser exposes persisted() and persist()
// together, so the helper provides both.
function setStorage({ persisted = false, persistGranted = false } = {}) {
  Object.defineProperty(navigator, 'storage', {
    value: {
      persisted: vi.fn().mockResolvedValue(persisted),
      persist: vi.fn().mockResolvedValue(persistGranted),
    },
    configurable: true,
  })
}

afterEach(() => {
  delete window.matchMedia
  delete navigator.storage
})

describe('requestPersistentStorage', () => {
  it('returns false when the Storage API is unavailable', async () => {
    expect(await requestPersistentStorage()).toBe(false)
  })

  it('returns true without requesting when already persisted', async () => {
    setStorage({ persisted: true })
    expect(await requestPersistentStorage()).toBe(true)
    expect(navigator.storage.persist).not.toHaveBeenCalled()
  })

  it('requests and returns the grant result when not yet persisted', async () => {
    setStorage({ persisted: false, persistGranted: true })
    expect(await requestPersistentStorage()).toBe(true)
    expect(navigator.storage.persist).toHaveBeenCalledOnce()
  })
})

describe('isStorageEvictionRisk', () => {
  it('is true when the browser will not grant persistence', async () => {
    setStorage({ persisted: false, persistGranted: false })
    expect(await isStorageEvictionRisk()).toBe(true)
  })

  it('is true when the Storage API is unavailable', async () => {
    expect(await isStorageEvictionRisk()).toBe(true)
  })

  it('is false when storage is already persisted', async () => {
    setStorage({ persisted: true })
    expect(await isStorageEvictionRisk()).toBe(false)
  })

  it('is false when persistence is granted on request', async () => {
    setStorage({ persisted: false, persistGranted: true })
    expect(await isStorageEvictionRisk()).toBe(false)
  })

  it('is false once installed (standalone), without touching storage', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    expect(await isStorageEvictionRisk()).toBe(false)
  })
})
