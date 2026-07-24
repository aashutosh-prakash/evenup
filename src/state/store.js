// Single source of truth: { people, expenses, title, paidSettlements }.
// Persisted as one JSON blob in localStorage.

import { computeBalances, settle, settlementKey } from '../lib/settle.js'

export const STORAGE_KEY = 'evenup.state'
// Bump when the persisted shape changes in a way that needs migration.
const SCHEMA_VERSION = 1

// Removes the persisted blob. Used by the error boundary's recovery action so
// the storage key lives in exactly one place.
export function clearStoredState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore unavailable storage
  }
}

export const initialState = {
  people: [],
  expenses: [],
  title: '',
  // Keys (fromId::toId::cents) of settlements the user has stamped "paid".
  // Purely a display marker — never affects balance math.
  paidSettlements: [],
}

// Collision-resistant unique id. Prefers crypto.randomUUID() (available in all
// modern browsers in a secure context); falls back to a random+counter scheme
// so ids never restart from a fixed sequence across reloads.
let counter = 0
export function newId(prefix) {
  counter += 1
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${counter}_${rand}`
}

// The smallest non-negative color index not already used by a person, so each
// person gets a distinct color and a freed index can be reused after removal.
export function nextColorIndex(people) {
  const used = new Set(people.map((p) => p.colorIndex).filter((i) => Number.isInteger(i)))
  let i = 0
  while (used.has(i)) i += 1
  return i
}

// Guarantees a DISTINCT colorIndex per person: keeps the first occurrence of
// each valid index and reassigns any missing OR duplicate index to the smallest
// free one. (Imported/shared data can carry duplicate colors; persisted older
// data can be missing them.)
function backfillColors(people) {
  const used = new Set()
  let next = 0
  return people.map((p) => {
    let c = p.colorIndex
    if (!Number.isInteger(c) || used.has(c)) {
      while (used.has(next)) next += 1
      c = next
    }
    used.add(c)
    return c === p.colorIndex ? p : { ...p, colorIndex: c }
  })
}

// The single validation path for untrusted { people, expenses, title } —
// distinct-colored, well-formed people and expenses whose references all
// resolve. Used by both loadState (persisted data) and the REPLACE_STATE
// reducer (a shared split being saved), so neither can bypass the store rules.
function sanitizeState(parsed) {
  const people = backfillColors(
    (Array.isArray(parsed?.people) ? parsed.people : [])
      .map(sanitizePerson)
      .filter(Boolean),
  )
  const peopleIds = people.map((p) => p.id)
  const validIds = new Set(peopleIds)
  const expenses = (Array.isArray(parsed?.expenses) ? parsed.expenses : [])
    .map((e) => sanitizeExpense(e, validIds, peopleIds))
    .filter(Boolean)
  const state = {
    people,
    expenses,
    title: typeof parsed?.title === 'string' ? parsed.title : '',
    // Keep only string keys, then drop any that no longer map to a live
    // settlement (e.g. amounts changed since this was saved/shared).
    paidSettlements: prunePaid(
      (Array.isArray(parsed?.paidSettlements) ? parsed.paidSettlements : []).filter(
        (k) => typeof k === 'string',
      ),
      people,
      expenses,
    ),
  }
  return state
}

// Orders participant ids to match the people array, so an expense's "split
// among" always renders in Members order regardless of the order boxes were
// ticked. Balance math is unaffected — computeBalances sorts ids itself.
function orderByPeople(ids, peopleIds) {
  const rank = new Map(peopleIds.map((id, i) => [id, i]))
  return [...ids].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))
}

// The set of settlement keys implied by the current people + expenses.
function liveSettlementKeys(people, expenses) {
  return new Set(settle(computeBalances(people, expenses)).map(settlementKey))
}

// Drops "paid" keys that no longer correspond to a current settlement, so a
// stamp can't linger (or spuriously reappear) after balances change. Skips the
// balance/settle recompute entirely when nothing is stamped — the common case
// for anyone who never taps a Paid stamp.
function prunePaid(paidSettlements, people, expenses) {
  if (paidSettlements.length === 0) return paidSettlements
  const live = liveSettlementKeys(people, expenses)
  return paidSettlements.filter((k) => live.has(k))
}

// Applies an expenses change and re-prunes stale paid stamps in one place, so
// every expense-mutating action keeps paidSettlements consistent (and a future
// action that forgets to prune can't reintroduce stale stamps).
function withExpenses(state, expenses) {
  return {
    ...state,
    expenses,
    paidSettlements: prunePaid(paidOf(state), state.people, expenses),
  }
}

// Coerce a single persisted person into a well-formed record, or null if it
// can't be salvaged (no usable id or name).
function sanitizePerson(p) {
  if (!p || typeof p !== 'object') return null
  const id = typeof p.id === 'string' && p.id ? p.id : null
  if (!id) return null
  const name = typeof p.name === 'string' ? p.name : ''
  const person = { id, name }
  if (Number.isInteger(p.colorIndex)) person.colorIndex = p.colorIndex
  return person
}

// Coerce a single persisted expense into a well-formed record, dropping any
// participant ids that don't map to a known person. Returns null if unsalvageable.
function sanitizeExpense(e, validIds, peopleIds) {
  if (!e || typeof e !== 'object') return null
  const id = typeof e.id === 'string' && e.id ? e.id : null
  if (!id) return null
  const amountNum = Number(e.amount)
  const amount = Number.isFinite(amountNum) ? amountNum : 0
  const participantIds = orderByPeople(
    (Array.isArray(e.participantIds) ? e.participantIds : []).filter((pid) =>
      validIds.has(pid),
    ),
    peopleIds,
  )
  const paidById = validIds.has(e.paidById) ? e.paidById : ''
  return {
    id,
    description: typeof e.description === 'string' ? e.description : '',
    amount,
    paidById,
    participantIds,
    // Preserve the original timestamp; use 0 (not Date.now) for legacy/invalid
    // values so reloading never silently rewrites the creation time.
    createdAt: Number.isFinite(Number(e.createdAt)) ? Number(e.createdAt) : 0,
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return initialState
    return sanitizeState(parsed)
  } catch {
    return initialState
  }
}

// Persists the state. Returns true on success, false on failure (quota
// exceeded, serialization error, or localStorage unavailable) so callers can
// warn the user instead of silently losing data. When there's nothing to
// persist (after "Clear all data") the key is removed entirely, leaving no
// "this app was used" marker behind.
export function saveState(state) {
  try {
    const empty =
      state.people.length === 0 &&
      state.expenses.length === 0 &&
      !state.title &&
      paidOf(state).length === 0
    if (empty) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, version: SCHEMA_VERSION }),
      )
    }
    return true
  } catch {
    return false
  }
}

// Normalizes write-path expense fields against the current people, so the
// reducer (the source of truth) enforces the same finite-amount and
// referential-integrity invariants that loadState applies to persisted data.
function normalizeExpenseFields(fields, people) {
  const peopleIds = people.map((p) => p.id)
  const validIds = new Set(peopleIds)
  const amount = Number(fields.amount)
  return {
    description: typeof fields.description === 'string' ? fields.description : '',
    amount: Number.isFinite(amount) ? amount : 0,
    paidById: validIds.has(fields.paidById) ? fields.paidById : '',
    // Store in Members order so the split renders consistently no matter what
    // order the checkboxes were toggled.
    participantIds: orderByPeople(
      (Array.isArray(fields.participantIds) ? fields.participantIds : []).filter((id) =>
        validIds.has(id),
      ),
      peopleIds,
    ),
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PERSON':
      return {
        ...state,
        people: [
          ...state.people,
          { id: newId('p'), name: action.name, colorIndex: nextColorIndex(state.people) },
        ],
      }

    case 'RENAME_PERSON': {
      // Only the display name changes; id and colorIndex stay put, so every
      // expense that references this person (and their avatar) is unaffected.
      const name = typeof action.name === 'string' ? action.name.trim() : ''
      if (!name) return state
      return {
        ...state,
        people: state.people.map((p) => (p.id === action.id ? { ...p, name } : p)),
      }
    }

    case 'REMOVE_PERSON':
      // Enforce referential integrity at the reducer (the single source of
      // truth), not just in the UI: refuse to remove a person still referenced
      // by any expense, so balances always reconcile to zero.
      if (personInUse(state, action.id)) return state
      return { ...state, people: state.people.filter((p) => p.id !== action.id) }

    case 'ADD_EXPENSE':
      return withExpenses(state, [
        ...state.expenses,
        {
          id: newId('e'),
          ...normalizeExpenseFields(action, state.people),
          createdAt: Date.now(),
        },
      ])

    case 'UPDATE_EXPENSE':
      return withExpenses(
        state,
        state.expenses.map((e) =>
          e.id === action.id
            ? { ...e, ...normalizeExpenseFields(action, state.people) }
            : e,
        ),
      )

    case 'REMOVE_EXPENSE':
      return withExpenses(
        state,
        state.expenses.filter((e) => e.id !== action.id),
      )

    case 'TOGGLE_SETTLEMENT_PAID': {
      // Stamp/unstamp a single settlement tile. Display-only; balance math and
      // the derived settlements are untouched.
      const key = action.key
      if (typeof key !== 'string' || !key) return state
      const current = paidOf(state)
      if (current.includes(key)) {
        return { ...state, paidSettlements: current.filter((k) => k !== key) }
      }
      // Only stamp a key that maps to a live settlement, so the reducer (the
      // validation boundary) never persists a stale or crafted key.
      if (!liveSettlementKeys(state.people, state.expenses).has(key)) return state
      return { ...state, paidSettlements: [...current, key] }
    }

    case 'SET_TITLE':
      return { ...state, title: action.title }

    case 'REPLACE_STATE':
      // Wholesale replace, used when saving a copy of a shared split. Run it
      // through the store's own sanitizer (not just decodeSplit's) so the
      // persisted data always obeys the store invariants.
      return sanitizeState(action.state)

    case 'CLEAR_ALL':
      // saveState removes the storage key when state is empty, so no marker is left.
      return { people: [], expenses: [], title: '', paidSettlements: [] }

    default:
      return state
  }
}

// Reads a state's paid-settlement keys, tolerating older/partial states (and
// test fixtures) that predate the field.
function paidOf(state) {
  return Array.isArray(state.paidSettlements) ? state.paidSettlements : []
}

// True if a person is referenced by any expense (payer or participant).
export function personInUse(state, personId) {
  return state.expenses.some(
    (e) =>
      e.paidById === personId ||
      (Array.isArray(e.participantIds) && e.participantIds.includes(personId)),
  )
}
