// Avatar color for a person, chosen by a sequential color index (assigned in
// the store when a person is added). Using golden-angle hue spacing means
// consecutive indices are ~137.5° apart, so colors assigned in order are always
// far apart in hue — no near-duplicates. Lightness stays low enough that white
// text is readable on every hue. There's no fixed palette to exhaust.
export function avatarColor(index) {
  const hue = Math.round((index * 137.508) % 360)
  return `hsl(${hue}deg 62% 42%)`
}

// Fallback only: derive a color index from an id for any person that somehow
// lacks a stored colorIndex (e.g. data written by an older version).
export function colorIndexForId(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}

export function initials(name) {
  // Strip symbols so names like "(removed)" still yield a letter.
  const cleaned = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
