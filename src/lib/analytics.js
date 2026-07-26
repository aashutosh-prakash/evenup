// URL sanitizer for Vercel Web Analytics.
//
// Share links carry the WHOLE split in the URL fragment (`#s=…`, see
// share-link.js). The fragment is never sent to a server by the browser, but
// analytics JS runs in the page: it reads location.href — fragment included —
// and POSTs it. So the fragment has to be stripped here, or every shared split
// (names and amounts) would be handed to the analytics vendor.
//
// Stripping it would also make every share-link visit look like a plain '/'
// hit, so a recognised share link is reported as its own SHARED_PATH page
// instead. That's what makes "how many people opened a shared split" answerable
// from the Pages breakdown.

import { MAX_URL_LENGTH } from './share-link.js'

// Synthetic path for share-link visits. No such route exists — the app is a
// single page — it's purely an analytics label.
export const SHARED_PATH = '/shared'

// Mirrors readSharedFromHash's extraction (share-link.js) so the two agree on
// what counts as a share link. Deliberately a cheap presence+bounds check
// rather than a real decode: decodeSplit mints throwaway ids, and this runs on
// every page event.
function hasSharePayload(hash) {
  const match = hash.replace(/^#/, '').match(/(?:^|&)s=([^&]*)/)
  const s = match ? match[1] : null
  return Boolean(s) && s.length <= MAX_URL_LENGTH
}

// Returns the URL with any fragment removed, rewritten to SHARED_PATH when the
// fragment held a share payload. Non-string input passes through untouched.
export function sanitizeAnalyticsUrl(url) {
  if (typeof url !== 'string' || !url) return url

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    // Not absolute (shouldn't happen via beforeSend, but don't leak if it does):
    // chop the fragment textually and give up on the path rewrite.
    const hashIndex = url.indexOf('#')
    return hashIndex === -1 ? url : url.slice(0, hashIndex)
  }

  const shared = hasSharePayload(parsed.hash)
  parsed.hash = ''
  if (shared) parsed.pathname = SHARED_PATH
  return parsed.toString()
}

// beforeSend hook for <Analytics />: Vercel runs every event through this in the
// browser before it leaves. Returns a copy with the url sanitized (returning
// null would drop the event entirely).
export function beforeSend(event) {
  if (!event) return event
  return { ...event, url: sanitizeAnalyticsUrl(event.url) }
}
