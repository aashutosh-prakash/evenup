// Platform / storage-context helpers. WebKit (all iOS browsers + macOS Safari)
// caps script-written storage and evicts it after ~7 days unused unless the
// site is an installed web app; Blink/Gecko (Android, desktop Chrome/Firefox)
// keep it durably. These helpers let the UI flag that difference.

// Is the app already running as an installed PWA? (standalone window)
export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari exposes this non-standard flag instead of display-mode.
    window.navigator.standalone === true
  )
}

// iOS forces every browser onto WebKit, so this matches all iOS browsers, not
// just Safari. (iOS Safari also never fires `beforeinstallprompt`.)
export function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

// Safari on macOS (also WebKit). vendor === 'Apple Computer, Inc.' identifies
// WebKit/Safari; excluding Chrome/Firefox/Edge/iOS narrows it to macOS Safari.
export function isDesktopSafari() {
  const ua = window.navigator.userAgent
  return (
    window.navigator.vendor === 'Apple Computer, Inc.' &&
    /safari/i.test(ua) &&
    !/chrome|crios|fxios|edg|android/i.test(ua) &&
    !isIos()
  )
}

// Ask the browser to exempt our storage from automatic eviction, and report
// whether it is now persistent. Returns true if already persistent or newly
// granted, false if denied/unsupported. Granted broadly on Chromium/Gecko and
// for installed WebKit web apps. Best-effort: never throws.
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true // already persistent
    return await navigator.storage.persist() // request; true if granted
  } catch {
    // Storage API unavailable or blocked.
    return false
  }
}

// True when saved data can actually be evicted — i.e. the browser would not
// grant persistent storage. We ask the browser directly (persisted/persist)
// instead of guessing from the platform; installed web apps are never at risk.
export async function isStorageEvictionRisk() {
  if (isStandalone()) return false
  return !(await requestPersistentStorage())
}
