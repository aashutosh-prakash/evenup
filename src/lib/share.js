import { computeBalances, computePaidTotals, computeTotal, settle } from './settle.js'
import { personOf } from './expense.js'

// Money for the shared text: drop the decimals for whole amounts, keep 2 for
// fractional ones (e.g. 12000 -> "12,000", 6877.75 -> "6,877.75").
function money(amount) {
  const n = Number(amount)
  const value = Number.isFinite(n) ? n : 0
  return value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

// Builds a plain-text summary of who paid what and who should settle up —
// for sharing/copying.
export function buildSummaryText(state) {
  const { people, expenses } = state
  const nameOf = (id) => personOf(people, id).name
  const paid = computePaidTotals(people, expenses)
  const txns = settle(computeBalances(people, expenses))

  const title = (state.title || '').trim()
  const heading = title ? `EvenUp — ${title}` : 'EvenUp summary'
  const lines = [heading]

  lines.push('', 'Paid:')
  for (const p of people) {
    const amount = paid[p.id] ?? 0
    // Skip people who didn't pay anything.
    if (amount > 0) lines.push(`• ${p.name}: ${money(amount)}`)
  }
  lines.push(`Total expenses: ${money(computeTotal(expenses))}`)

  lines.push('', 'Settle up:')
  if (txns.length === 0) {
    lines.push('• Everyone is settled 🎉')
  } else {
    for (const t of txns) {
      lines.push(`• ${nameOf(t.fromId)} → ${nameOf(t.toId)}: ${money(t.amount)}`)
    }
  }

  return lines.join('\n')
}

// Tries the native share sheet first, then falls back to the clipboard.
// Returns one of: 'shared' | 'copied' | 'cancelled' | 'failed'.
export async function shareSummary(text) {
  if (navigator.share) {
    try {
      // No separate `title` — the heading already lives in `text`, so passing
      // a title too would show the heading twice in some share targets.
      await navigator.share({ text })
      return 'shared'
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled'
      // otherwise fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
