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
//
// Because this is a leak guard, it FAILS CLOSED: any url it can't fully parse
// and rewrite is refused, and the caller drops the event. Losing one datapoint
// is cheap; leaking a split is not.

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

// Decides which page a visit should be reported as, from the fragment of the
// url being reported. `decoded` is whether the app actually resolved the current
// link into a viewable split (i.e. readSharedFromHash returned non-null) —
// passing the real render outcome in, rather than re-deriving it, keeps this from
// drifting away from decodeSplit's rules. Returns null when the fragment carries
// no share payload, meaning "report this url's own path".
export function shareAnalyticsPath(hash, decoded) {
  if (readShareParam(hash) === null) return null
  return decoded ? SHARED_PATH : SHARED_BROKEN_PATH
}

// Returns the url with its fragment removed, and its path replaced by a share
// label when THIS url's fragment carries a share payload. Returns null when the
// url can't be handled, so the caller can drop the event rather than send
// something half-sanitized.
export function sanitizeAnalyticsUrl(url, decoded = false) {
  if (typeof url !== 'string' || !url) return null

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    // Can't reason about it, so don't try to salvage it.
    return null
  }

  // Derived per url, NOT captured once at setup: one hook instance can see
  // several events, and a share label must never be smeared onto an event whose
  // own url carries no payload.
  const sharePath = shareAnalyticsPath(parsed.hash, decoded)
  parsed.hash = ''
  if (sharePath) parsed.pathname = sharePath
  return parsed.toString()
}

// Builds the beforeSend hook for <Analytics />. Vercel runs every event through
// it in the browser before the event leaves, so this is the last place the
// fragment can be removed. `decoded` is the current share-state outcome; the
// share payload's presence is read from each event's own url. Returns null to
// drop the event whenever the url can't be safely rewritten.
export function createBeforeSend(decoded) {
  return function beforeSend(event) {
    if (!event) return null
    const url = sanitizeAnalyticsUrl(event.url, decoded)
    if (url === null) return null
    return { ...event, url }
  }
}
