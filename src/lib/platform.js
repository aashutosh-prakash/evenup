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

// True when this origin's saved data can actually be evicted. We check the
// real granted state with navigator.storage.persisted() rather than assuming
// from the platform: persisted storage is exempt from eviction, so if it's
// granted we never warn. We still scope the warning to WebKit (iOS any browser,
// or macOS Safari), because that's where best-effort storage is aggressively
// capped (~7 days unused); on Blink/Gecko best-effort eviction only happens
// under real disk pressure, so warning every Chrome user would be noise.
export async function isStorageEvictionRisk() {
  if (isStandalone()) return false
  if (!(isIos() || isDesktopSafari())) return false
  try {
    // Persistence was actually granted (e.g. WebKit honored persist()) — safe.
    if (await navigator.storage?.persisted?.()) return false
  } catch {
    // Storage API unavailable — fall through and treat as at-risk.
  }
  return true
}

// Ask the browser to exempt our storage from automatic eviction. Granted
// broadly on Chromium/Gecko and for installed WebKit web apps; a harmless
// no-op (resolves false) where unsupported or denied. Best-effort: never throws.
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      return await navigator.storage.persist()
    }
  } catch {
    // Storage API unavailable or blocked — nothing to do.
  }
  return false
}
