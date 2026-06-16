// Deterministic avatar color + initials for a person, derived from a stable
// seed (the person id). Colors never change and don't need to be stored.

const PALETTE = [
  '#e8453c', '#f9a825', '#43a047', '#1e88e5', '#8e24aa',
  '#00897b', '#fb8c00', '#3949ab', '#d81b60', '#00acc1',
]

export function avatarColor(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function initials(name) {
  // Strip symbols so names like "(removed)" still yield a letter.
  const cleaned = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
