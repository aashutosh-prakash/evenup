// Single source of truth: { people, expenses }.
// Persisted as one JSON blob in localStorage.

const STORAGE_KEY = 'evenup.state'

export const initialState = {
  people: [],
  expenses: [],
}

// Simple unique id without external deps.
let counter = 0
export function newId(prefix) {
  counter += 1
  return `${prefix}_${counter}_${Math.floor(performance.now())}`
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    return {
      people: Array.isArray(parsed.people) ? parsed.people : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
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
      return { ...state, people: [...state.people, { id: newId('p'), name: action.name }] }

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

    case 'CLEAR_ALL':
      return { people: [], expenses: [] }

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
