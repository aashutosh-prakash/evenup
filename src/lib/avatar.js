// Curated, soft, visually-distinct palette (Material-style shades, all readable
// with white text). Colors are assigned by a sequential index (see the store),
// so people get distinct colors with no duplicates until the palette is
// exhausted. The first 10 are the original well-liked set.
const PALETTE = [
  '#e8453c', '#f9a825', '#43a047', '#1e88e5', '#8e24aa',
  '#00897b', '#fb8c00', '#3949ab', '#d81b60', '#00acc1',
  '#5e35b1', '#689f38', '#c2185b', '#0097a7', '#f4511e',
  '#6d4c41', '#546e7a', '#2e7d32', '#ad1457', '#283593',
  '#00695c', '#7b1fa2', '#d84315', '#0277bd',
]

// Avatar color for a person, by sequential color index. Within the curated
// palette colors are distinct; beyond it (rare — >24 people) we fall back to
// generated hues with soft saturation/lightness so they still read well.
export function avatarColor(index) {
  if (index < PALETTE.length) return PALETTE[index]
  const hue = Math.round((index * 137.508) % 360)
  return `hsl(${hue}deg 55% 50%)`
}

// Fallback only: derive a color index from an id for any person that somehow
// lacks a stored colorIndex (e.g. data written by an older version). Maps into
// the curated palette.
export function colorIndexForId(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % PALETTE.length
}

export function initials(name) {
  // Strip symbols so names like "(removed)" still yield a letter.
  const cleaned = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
