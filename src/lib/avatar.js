// Deterministic avatar color + initials for a person, derived from a stable
// seed (the person id). Colors never change and don't need to be stored.

// Generates an HSL color from the seed across the full hue spectrum. Hue,
// saturation and lightness are drawn from different parts of the hash so the
// space is large (~360 × 25 × 6 ≈ 54k combinations) — colors effectively never
// repeat for any realistic number of people. Lightness is kept low enough that
// white text stays readable on every hue.
export function avatarColor(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  hash = Math.abs(hash)
  const hue = hash % 360
  const saturation = 55 + (Math.floor(hash / 360) % 25) // 55–79%
  const lightness = 40 + (Math.floor(hash / 9000) % 6) // 40–45%
  return `hsl(${hue}deg ${saturation}% ${lightness}%)`
}

export function initials(name) {
  // Strip symbols so names like "(removed)" still yield a letter.
  const cleaned = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
