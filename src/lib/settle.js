// All money math is done in integer cents to avoid float drift.

export function toCents(amount) {
  return Math.round(amount * 100)
}

export function fromCents(cents) {
  return Math.round(cents) / 100
}
