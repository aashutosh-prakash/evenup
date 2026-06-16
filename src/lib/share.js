import { computeBalances, computePaidTotals, settle, formatMoney } from './settle.js'

// Builds a plain-text summary of who paid what and who should settle up.
export function buildSummaryText(state) {
  const { people, expenses } = state
  const nameOf = (id) => people.find((p) => p.id === id)?.name ?? '(removed)'
  const paid = computePaidTotals(people, expenses)
  const txns = settle(computeBalances(people, expenses))

  const title = (state.title || '').trim()
  const heading = title ? `EvenUp — ${title}` : 'EvenUp summary'
  const lines = [heading, '', 'Paid:']
  for (const p of people) {
    lines.push(`• ${p.name}: ${formatMoney(paid[p.id] ?? 0)}`)
  }

  lines.push('', 'Settle up:')
  if (txns.length === 0) {
    lines.push('• Everyone is settled 🎉')
  } else {
    for (const t of txns) {
      lines.push(`• ${nameOf(t.fromId)} → ${nameOf(t.toId)}: ${formatMoney(t.amount)}`)
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
