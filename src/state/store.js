// Single source of truth: { people, expenses }.
// Persisted as one JSON blob in localStorage.

const STORAGE_KEY = 'evenup.state'

export const initialState = {
  people: [],
  expenses: [],
  title: '',
}

// Simple unique id without external deps.
let counter = 0
export function newId(prefix) {
  counter += 1
  return `${prefix}_${counter}_${Math.floor(performance.now())}`
}

// The smallest non-negative color index not already used by a person, so each
// person gets a distinct color and a freed index can be reused after removal.
export function nextColorIndex(people) {
  const used = new Set(
    people.map((p) => p.colorIndex).filter((i) => Number.isInteger(i)),
  )
  let i = 0
  while (used.has(i)) i += 1
  return i
}

// Assigns a distinct colorIndex to any person missing one (e.g. data written
// by an older version), preserving indices that are already set.
function backfillColors(people) {
  const used = new Set(
    people.map((p) => p.colorIndex).filter((i) => Number.isInteger(i)),
  )
  let next = 0
  return people.map((p) => {
    if (Number.isInteger(p.colorIndex)) return p
    while (used.has(next)) next += 1
    used.add(next)
    return { ...p, colorIndex: next }
  })
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    return {
      people: Array.isArray(parsed.people) ? backfillColors(parsed.people) : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      title: typeof parsed.title === 'string' ? parsed.title : '',
    }
  } catch {
    return initialState
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / unavailable storage
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

    case 'REMOVE_PERSON':
      return { ...state, people: state.people.filter((p) => p.id !== action.id) }

    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [
          ...state.expenses,
          {
            id: newId('e'),
            description: action.description,
            amount: action.amount,
            paidById: action.paidById,
            participantIds: action.participantIds,
            createdAt: Date.now(),
          },
        ],
      }

    case 'REMOVE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }

    case 'SET_TITLE':
      return { ...state, title: action.title }

    case 'CLEAR_ALL':
      return { people: [], expenses: [], title: '' }

    default:
      return state
  }
}

// True if a person is referenced by any expense (payer or participant).
export function personInUse(state, personId) {
  return state.expenses.some(
    (e) => e.paidById === personId || e.participantIds.includes(personId),
  )
}
