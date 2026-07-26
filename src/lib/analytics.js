// URL sanitizer and page labelling for Vercel Web Analytics.
//
// Share links carry the WHOLE split in the URL fragment (`#s=…`, see
// share-link.js). The fragment is never sent to a server by the browser, but
// analytics JS runs in the page: it reads location.href — fragment included —
// and POSTs it. Verified in a browser that an unguarded <Analytics /> sends the
// full payload; Vercel does NOT strip fragments. So stripping it here is
// load-bearing, not belt-and-braces.
//
// Stripping alone would make every share-link visit look like a plain '/' hit,
// so a share-link visit is reported under its own synthetic path instead. That's
// what makes "how many people opened a shared split" answerable from the Pages
// breakdown.

import { readShareParam } from './share-link.js'

// Synthetic paths for share-link visits. Neither route exists — the app is a
// single page — they're purely analytics labels.
export const SHARED_PATH = '/shared'
// A link that carried a payload we couldn't decode: truncated by a messaging
// app, hand-edited, or built by an older/newer version of the wire format. The
// viewer sees the normal editor, so counting these under SHARED_PATH would
// overstate reach — they're tracked separately because a rising count here means
// links are breaking in transit.
export const SHARED_BROKEN_PATH = '/shared-broken'

// Decides which page a visit should be reported as. `decoded` is whether the
// app actually resolved the link into a viewable split (i.e. readSharedFromHash
// returned non-null) — passing the real render outcome in, rather than
// re-deriving it, keeps this from drifting away from decodeSplit's rules.
// Returns null for an ordinary visit that carried no share link.
export function shareAnalyticsPath(hash, decoded) {
  if (readShareParam(hash) === null) return null
  return decoded ? SHARED_PATH : SHARED_BROKEN_PATH
}

// Returns the URL with any fragment removed, its path replaced by `sharePath`
// when one is given. Non-string input passes through untouched.
export function sanitizeAnalyticsUrl(url, sharePath = null) {
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

  parsed.hash = ''
  if (sharePath) parsed.pathname = sharePath
  return parsed.toString()
}

// Builds the beforeSend hook for <Analytics />. Vercel runs every event through
// it in the browser before the event leaves, so this is the last place the
// fragment can be removed. Returns a copy with the url sanitized (returning null
// instead would drop the event entirely).
export function createBeforeSend(sharePath) {
  return function beforeSend(event) {
    if (!event) return event
    return { ...event, url: sanitizeAnalyticsUrl(event.url, sharePath) }
  }
}
