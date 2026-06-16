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

// Greedy minimal settlement: repeatedly match the largest creditor with the
// largest debtor. Input: map of personId -> balance (major units).
// Output: array of { fromId, toId, amount } with positive amounts.
export function settle(balances) {
  const creditors = []
  const debtors = []
  for (const [id, bal] of Object.entries(balances)) {
    const cents = toCents(bal)
    if (cents > 0) creditors.push({ id, cents })
    else if (cents < 0) debtors.push({ id, cents: -cents })
  }
  creditors.sort((x, y) => y.cents - x.cents)
  debtors.sort((x, y) => y.cents - x.cents)

  const txns = []
  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci]
    const d = debtors[di]
    const pay = Math.min(c.cents, d.cents)
    txns.push({ fromId: d.id, toId: c.id, amount: fromCents(pay) })
    c.cents -= pay
    d.cents -= pay
    if (c.cents === 0) ci += 1
    if (d.cents === 0) di += 1
  }
  return txns
}

// Total each person paid across all expenses. Returns personId -> amount.
export function computePaidTotals(people, expenses) {
  const cents = {}
  for (const p of people) cents[p.id] = 0
  for (const exp of expenses) {
    if (cents[exp.paidById] !== undefined) cents[exp.paidById] += toCents(exp.amount)
  }
  const out = {}
  for (const id of Object.keys(cents)) out[id] = fromCents(cents[id])
  return out
}

// Formats a major-unit amount to 2 decimals with thousands separators.
export function formatMoney(amount) {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
