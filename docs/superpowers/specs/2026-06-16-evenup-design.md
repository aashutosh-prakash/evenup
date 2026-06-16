# EvenUp — Design Spec

**Date:** 2026-06-16
**Status:** Approved

## Summary

EvenUp is a local-only, single-page web app for splitting shared expenses
equally among a group of people and showing who should pay whom to settle up.
There is no login and no server — all data lives in the browser's
`localStorage`. Built with React + Vite.

## Goals

- Add people by name.
- Add expenses (description, amount, who paid, who it's split among).
- Split each expense **equally** among its selected participants.
- Show **per-person balances** and a **simplified "who pays whom"** settlement.
- Persist everything locally so data survives page reloads.
- Be easy to run and self-host (open source, MIT).

## Non-Goals (YAGNI)

- No user accounts, authentication, or backend/server.
- No multiple groups — a single flat list of people and expenses.
- No unequal splits (exact amounts, percentages, shares).
- No multi-currency conversion or exchange rates.
- No data sync across devices.

## Data Model

Stored as a single JSON object in `localStorage` under one key (e.g. `evenup.state`):

```
Person  { id: string, name: string }
Expense { id: string, description: string, amount: number,
          paidById: string, participantIds: string[], createdAt: number }
State   { people: Person[], expenses: Expense[], currencySymbol: string }
```

- `amount` is a positive number (interpreted as a major currency unit, e.g. 120.00).
- `paidById` references one person who fronted the money.
- `participantIds` are the people the expense is split equally among.
- `currencySymbol` is a user-configurable display string (default: empty).

## The Math (`src/lib/settle.js` — pure, unit-tested)

- **Per-person balance** = (sum of amounts they paid) − (sum of their equal
  share of every expense they participated in).
  - Positive balance ⇒ they are owed money. Negative ⇒ they owe.
- **Equal share** of an expense = `amount / participantIds.length`.
- **Rounding:** compute in integer cents to avoid floating-point drift. Any
  leftover penny from non-even division is assigned deterministically (e.g. to
  the first participant by id order) so totals always reconcile to the original
  amount.
- **Simplified settlement:** greedy algorithm — repeatedly match the largest
  debtor with the largest creditor, settle the smaller of the two magnitudes,
  and continue until all balances are zero. Produces the fewest
  "X pays Y amount" transactions.

These functions are pure (no React) and are the riskiest part of the app, so
they get unit tests first.

## UI Layout (single page, three areas)

1. **Header** — app title + a small currency-symbol input (applies everywhere).
2. **People panel** — add a person by name; remove a person. Guard/confirm if
   that person appears in any expense (as payer or participant).
3. **Expenses** — a form (description, amount, payer dropdown, participant
   checkboxes) plus a list of added expenses, each removable.
4. **Summary** — per-person net balances AND the simplified "who pays whom"
   list. Recomputed live whenever people or expenses change.

Amounts everywhere are formatted to 2 decimals and prefixed/labeled with
`currencySymbol` (or plain numbers when it's empty).

## Code Structure

```
evenup/
  index.html
  package.json
  vite.config.js
  README.md
  LICENSE            # MIT
  .gitignore
  src/
    main.jsx
    App.jsx
    state/           # localStorage load/save + reducer
    lib/
      settle.js      # pure balance + settlement logic
      settle.test.js # unit tests for the math
    components/
      PeoplePanel.jsx
      ExpenseForm.jsx
      ExpenseList.jsx
      Summary.jsx
```

- Plain React state + a small reducer; no external state-management library.
- Plain CSS (no Tailwind, no component library).
- Vite for dev server + build.

## Error Handling / Edge Cases

- Expense with 0 participants: blocked by form validation (must select ≥1).
- Amount must be a positive number; invalid input is rejected by the form.
- Person names: trim input; **block empty names**; **allow duplicate names**
  (people are identified by id, not name).
- Removing a person referenced by any expense (as payer or participant):
  **block the removal** and show a clear message telling the user to remove or
  edit those expenses first.
- Corrupt/missing localStorage: fall back to empty initial state.

## Testing

- Unit tests for `lib/settle.js`: balance computation, equal split, rounding
  remainder handling, and settlement minimization across several scenarios
  (everyone even, single debtor, multiple debtors/creditors).
- Manual smoke test of the UI flow (add people → add expense → see settlement).

## Open Source Basics

- `README.md`: what it is, screenshots optional, `npm install && npm run dev`
  to run, `npm run build` to produce a static bundle that can be hosted anywhere.
- MIT `LICENSE`.
- `.gitignore` for `node_modules`, `dist`, etc.
