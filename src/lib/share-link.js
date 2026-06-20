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

import { newId } from '../state/store.js'

// Keep shared URLs under this length so they survive the address bar, QR
// codes, and messaging apps that truncate long links.
export const MAX_URL_LENGTH = 2000

// UTF-8-safe base64url: encode to bytes first so Unicode names/emoji survive
// btoa (which only handles Latin-1).
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded) {
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  // Restore the stripped '=' padding so atob accepts the string.
  while (b64.length % 4 !== 0) b64 += '='
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

// Builds the compact wire payload from app state.
export function encodeSplit(state) {
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

  return toBase64Url(JSON.stringify(payload))
}

// Decodes a wire string back into app state with FRESH ids. Every field is
// coerced/validated defensively and built explicitly (never spread from the
// untrusted payload) so a malicious blob can't pollute or smuggle in fields.
// Returns null on ANY parse/decode error.
export function decodeSplit(encoded) {
  try {
    if (typeof encoded !== 'string' || !encoded) return null
    const payload = JSON.parse(fromBase64Url(encoded))
    if (!payload || typeof payload !== 'object') return null

    const rawPeople = Array.isArray(payload.p) ? payload.p : []
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
    const rawExpenses = Array.isArray(payload.e) ? payload.e : []
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

    return {
      title: typeof payload.t === 'string' ? payload.t : '',
      people,
      expenses,
    }
  } catch {
    return null
  }
}

// Builds the full shareable URL. Returns null when the split is empty (nothing
// worth sharing) or when the URL would exceed MAX_URL_LENGTH.
export function buildShareUrl(state, origin = window.location.origin) {
  const people = Array.isArray(state?.people) ? state.people : []
  const expenses = Array.isArray(state?.expenses) ? state.expenses : []
  if (people.length === 0 && expenses.length === 0) return null

  const url = `${origin}/#s=${encodeSplit(state)}`
  if (url.length > MAX_URL_LENGTH) return null
  return url
}

// Builds a share URL and verifies it actually round-trips (decodes back to the
// same number of people/expenses) before we hand it out. Returns the URL when
// the split is "properly composed", or null so the caller can fall back to the
// plain-text summary (split empty, too large, or — defensively — corrupted).
export function composeShareUrl(state, origin = window.location.origin) {
  const url = buildShareUrl(state, origin)
  if (!url) return null
  const decoded = decodeSplit(url.slice(url.indexOf('#s=') + 3))
  if (!decoded) return null
  const people = Array.isArray(state?.people) ? state.people : []
  const expenses = Array.isArray(state?.expenses) ? state.expenses : []
  if (decoded.people.length !== people.length) return null
  if (decoded.expenses.length !== expenses.length) return null
  return url
}

// Reads the 's' param out of a location hash and decodes it. Returns null when
// the param is absent or fails to decode.
export function readSharedFromHash(hash = window.location.hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const s = params.get('s')
  // Cap on the read side too: decode can never need to be bigger than encode
  // could produce, so reject implausibly long input before allocating.
  if (!s || s.length > MAX_URL_LENGTH) return null
  return decodeSplit(s)
}

// Tries the native share sheet first, then falls back to the clipboard.
// `text` is an optional heading line shown above the link (e.g. "EvenKar —
// Goa Trip"). Returns one of: 'shared' | 'copied' | 'cancelled' | 'failed'.
export async function shareLink(url, text) {
  if (navigator.share) {
    try {
      await navigator.share(text ? { text, url } : { url })
      return 'shared'
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled'
      // otherwise fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text ? `${text}\n${url}` : url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
