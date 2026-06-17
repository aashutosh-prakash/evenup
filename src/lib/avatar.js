// Avatar colors drawn from the Material Design palette. Each person gets a soft
// same-hue pair: a light tinted background (Material 100) plus a darker shade of
// the same hue for the initials (Material 800). Flat and muted — professional,
// not flashy. Pairs are assigned by a sequential color index (see the store),
// so people get distinct hues with no duplicates until the set is exhausted.
const COLORS = [
  ['#bbdefb', '#1565c0'], // blue
  ['#c8e6c9', '#2e7d32'], // green
  ['#e1bee7', '#6a1b9a'], // purple
  ['#ffe0b2', '#e65100'], // orange
  ['#b2dfdb', '#00695c'], // teal
  ['#ffcdd2', '#c62828'], // red
  ['#c5cae9', '#283593'], // indigo
  ['#b2ebf2', '#00838f'], // cyan
  ['#f8bbd0', '#ad1457'], // pink
  ['#d7ccc8', '#4e342e'], // brown
  ['#cfd8dc', '#37474f'], // blue grey
  ['#ffccbc', '#d84315'], // deep orange
]

const wrap = (n, len) => ((n % len) + len) % len

// Background tint + initials color for a person, by sequential color index.
export function avatarColors(index) {
  const [bg, fg] = COLORS[wrap(index, COLORS.length)]
  return { bg, fg }
}

// Fallback only: derive a color index from an id for any person that somehow
// lacks a stored colorIndex (e.g. data written by an older version). Maps into
// the color set.
export function colorIndexForId(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % COLORS.length
}

export function initials(name) {
  // Strip symbols so names like "(removed)" still yield a letter.
  const cleaned = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
