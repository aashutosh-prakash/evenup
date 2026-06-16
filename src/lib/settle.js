// All money math is done in integer cents to avoid float drift.

export function toCents(amount) {
  return Math.round(amount * 100)
}

export function fromCents(cents) {
  return Math.round(cents) / 100
}

// Returns a map of personId -> net balance (major units).
// Positive = owed money; negative = owes money.
// Works in cents; the leftover penny from an uneven split is assigned to
// participants in ascending id order so balances always reconcile to 0.
export function computeBalances(people, expenses) {
  const cents = {}
  for (const p of people) cents[p.id] = 0

  for (const exp of expenses) {
    const n = exp.participantIds.length
    if (n === 0) continue
    const total = toCents(exp.amount)
    if (cents[exp.paidById] !== undefined) cents[exp.paidById] += total

    const base = Math.floor(total / n)
    let remainder = total - base * n
    const ordered = [...exp.participantIds].sort()
    for (const pid of ordered) {
      let share = base
      if (remainder > 0) {
        share += 1
        remainder -= 1
      }
      if (cents[pid] !== undefined) cents[pid] -= share
    }
  }

  const out = {}
  for (const id of Object.keys(cents)) out[id] = fromCents(cents[id])
  return out
}
