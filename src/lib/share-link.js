// Encodes the current split into a short URL-hash string for a read-only
// shared view, and decodes it back. The wire format is deliberately compact
// (NOT the storage shape): UUIDs are dropped and people are referenced by
// their array index, so the URLs stay short.
//
// Wire payload:
//   { t: title||undefined,
//     p: [{ n: name, c: colorIndex }],
//     e: [{ d: description||undefined, a: amount, p: payerIndex (-1 if none),
//           s: [participantIndex, ...] }] }

import LZString from 'lz-string'
import { newId } from '../state/store.js'

// Keep shared URLs under this length so they survive the address bar, QR
// codes, and messaging apps that truncate long links.
export const MAX_URL_LENGTH = 2000

// Decode-side bounds (defense-in-depth): a crafted, highly-repetitive blob can
// stay under MAX_URL_LENGTH yet decompress to far more entries than encode could
// ever produce, so cap both the compressed input and the decoded record counts
// to keep a malicious link from near-freezing a low-end device.
const MAX_PAYLOAD_LENGTH = MAX_URL_LENGTH
const MAX_PEOPLE = 500
const MAX_EXPENSES = 1000

// Builds the compact wire payload from app state. `sharedAt` (epoch ms,
// captured at share time) is embedded purely so the receipt can show when the
// split was shared; it is not part of the app's persisted state.
export function encodeSplit(state, sharedAt) {
  const title = typeof state?.title === 'string' ? state.title.trim() : ''
  const people = Array.isArray(state?.people) ? state.people : []
  const expenses = Array.isArray(state?.expenses) ? state.expenses : []

  // Index people by id so expenses can reference them positionally.
  const indexById = new Map()
  people.forEach((p, i) => indexById.set(p?.id, i))

  const payload = {
    p: people.map((p) => ({
      n: typeof p?.name === 'string' ? p.name : '',
      c: Number.isInteger(p?.colorIndex) ? p.colorIndex : 0,
    })),
    e: expenses.map((exp) => {
      const description =
        typeof exp?.description === 'string' ? exp.description.trim() : ''
      const amountNum = Number(exp?.amount)
      const payerIndex = indexById.has(exp?.paidById) ? indexById.get(exp.paidById) : -1
      const participantIds = Array.isArray(exp?.participantIds) ? exp.participantIds : []
      const wire = {
        a: Number.isFinite(amountNum) ? amountNum : 0,
        p: payerIndex,
        s: participantIds
          .filter((pid) => indexById.has(pid))
          .map((pid) => indexById.get(pid)),
      }
      if (description) wire.d = description
      return wire
    }),
  }
  if (title) payload.t = title
  if (Number.isFinite(sharedAt)) payload.ts = sharedAt

  // Compress to a URL-safe string. The wire format is very repetitive, so this
  // shrinks links dramatically (often 50-90%), letting much larger splits share
  // as a link before falling back to the text summary.
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
}

// Decompress + parse a wire string into the raw payload object, or null on any
// error. Side-effect free (no id minting) so callers that only need to inspect
// the payload — e.g. composeShareUrl's round-trip check — don't pay for a full
// decode.
function parseWire(encoded) {
  try {
    if (typeof encoded !== 'string' || !encoded) return null
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const payload = JSON.parse(json)
    return payload && typeof payload === 'object' ? payload : null
  } catch {
    return null
  }
}

// Decodes a wire string back into app state with FRESH ids. Every field is
// coerced/validated defensively and built explicitly (never spread from the
// untrusted payload) so a malicious blob can't pollute or smuggle in fields.
// Returns null on ANY parse/decode error, or for an empty split (no people and
// no expenses) so a blank crafted link can't render a wipe-the-data view.
export function decodeSplit(encoded) {
  try {
    const payload = parseWire(encoded)
    if (!payload) return null

    const rawPeople = (Array.isArray(payload.p) ? payload.p : []).slice(0, MAX_PEOPLE)
    // Build people with fresh ids; remember each wire index -> new id so
    // expenses can be rebuilt.
    const idByIndex = []
    const people = rawPeople.map((p, i) => {
      const id = newId('p')
      idByIndex[i] = id
      return {
        id,
        name: p && typeof p.n === 'string' ? p.n : '',
        colorIndex: p && Number.isInteger(p.c) ? p.c : 0,
      }
    })

    const validIndices = new Set(idByIndex.map((_, i) => i))
    const rawExpenses = (Array.isArray(payload.e) ? payload.e : []).slice(0, MAX_EXPENSES)
    const expenses = rawExpenses.map((exp) => {
      // Accept the amount only as a finite number on the wire (what encodeSplit
      // writes), so a crafted hex/exponent/array string can't smuggle a value.
      const amount =
        exp && typeof exp.a === 'number' && Number.isFinite(exp.a) ? exp.a : 0
      const payerIndex = exp && Number.isInteger(exp.p) ? exp.p : -1
      const paidById = validIndices.has(payerIndex) ? idByIndex[payerIndex] : ''
      // Keep only valid, UNIQUE participant indices (preserving order). A
      // crafted payload with duplicate indices would otherwise charge one
      // person twice and break the split, so balances wouldn't reconcile.
      const rawParticipants = exp && Array.isArray(exp.s) ? exp.s : []
      const seen = new Set()
      const participantIds = []
      for (const idx of rawParticipants) {
        if (!validIndices.has(idx) || seen.has(idx)) continue
        seen.add(idx)
        participantIds.push(idByIndex[idx])
      }
      return {
        id: newId('e'),
        description: exp && typeof exp.d === 'string' ? exp.d : '',
        amount,
        paidById,
        participantIds,
        createdAt: 0,
      }
    })

    // An empty split is nothing to view — and would let a crafted #s= link
    // render a blank SharedView whose "Save a copy" wipes the viewer's data.
    if (people.length === 0 && expenses.length === 0) return null

    return {
      title: typeof payload.t === 'string' ? payload.t : '',
      people,
      expenses,
      // Display-only: when the split was shared (epoch ms), or null if absent.
      sharedAt: Number.isFinite(payload.ts) ? payload.ts : null,
    }
  } catch {
    return null
  }
}

// Builds the full shareable URL. Returns null when the split is empty (nothing
// worth sharing) or when the URL would exceed MAX_URL_LENGTH.
export function buildShareUrl(state, origin = window.location.origin, sharedAt) {
  const people = Array.isArray(state?.people) ? state.people : []
  const expenses = Array.isArray(state?.expenses) ? state.expenses : []
  if (people.length === 0 && expenses.length === 0) return null

  const url = `${origin}/#s=${encodeSplit(state, sharedAt)}`
  if (url.length > MAX_URL_LENGTH) return null
  return url
}

// Builds a share URL and verifies it actually round-trips (decodes back to the
// same number of people/expenses) before we hand it out. Returns the URL when
// the split is "properly composed", or null so the caller can fall back to the
// plain-text summary (split empty, too large, or — defensively — corrupted).
export function composeShareUrl(
  state,
  origin = window.location.origin,
  sharedAt = Date.now(),
) {
  const url = buildShareUrl(state, origin, sharedAt)
  if (!url) return null
  // Verify the payload decompresses back to the same counts, WITHOUT a full
  // decodeSplit (which would mint throwaway ids on every Share click).
  const payload = parseWire(url.slice(url.indexOf('#s=') + 3))
  if (!payload) return null
  const people = Array.isArray(state?.people) ? state.people : []
  const expenses = Array.isArray(state?.expenses) ? state.expenses : []
  const pLen = Array.isArray(payload.p) ? payload.p.length : 0
  const eLen = Array.isArray(payload.e) ? payload.e.length : 0
  if (pLen !== people.length || eLen !== expenses.length) return null
  return url
}

// Reads the 's' param out of a location hash and decodes it. Returns null when
// the param is absent or fails to decode.
export function readSharedFromHash(hash = window.location.hash) {
  // Extract the raw `s=` value WITHOUT URL-decoding — lz-string's encoded output
  // can contain '+', which URLSearchParams would corrupt into spaces.
  const match = hash.replace(/^#/, '').match(/(?:^|&)s=([^&]*)/)
  const s = match ? match[1] : null
  // Reject implausibly long input before allocating (see MAX_PAYLOAD_LENGTH).
  if (!s || s.length > MAX_PAYLOAD_LENGTH) return null
  return decodeSplit(s)
}

// Tries the native share sheet first, then falls back to the clipboard.
// `text` is an optional heading (e.g. "EvenKar — Goa Trip") placed on top,
// then a blank line, then the link. Returns one of:
// 'shared' | 'copied' | 'cancelled' | 'failed'.
export async function shareLink(url, text) {
  if (navigator.share) {
    try {
      // Pass the link in the dedicated `url` field so share targets treat it as
      // a real, tappable link — NOT glued into the text (which corrupts it into
      // one broken address). `text` carries the heading.
      await navigator.share(text ? { text, url } : { url })
      return 'shared'
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled'
      // otherwise fall through to clipboard
    }
  }
  try {
    // Clipboard fallback keeps the heading on top, a blank line, then the link.
    await navigator.clipboard.writeText(text ? `${text}\n\n${url}` : url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
