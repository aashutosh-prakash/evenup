// Shared expense helpers used by the add form, the inline editor, and the
// summary/list views — so the validation rules and the "(removed)" fallback
// live in exactly one place.

export const EXPENSE_FIELDS = ['description', 'amount', 'paidById', 'participantIds']

// Minimum people needed before expenses can be split, with the matching
// guidance copy in one place so the threshold and wording never drift.
export const MIN_PEOPLE = 2

export function peopleNeededHint(count) {
  if (count >= MIN_PEOPLE) return ''
  return count === 0
    ? `Add at least ${MIN_PEOPLE} people to start splitting.`
    : 'Add one more person to start splitting.'
}

// Validates a raw expense draft (amount may be a string straight from an
// <input>). Returns { errors, cleaned }: `errors` is empty when valid, and
// `cleaned` holds the normalized fields ready to dispatch.
export function validateExpenseDraft(draft) {
  const description = (draft.description ?? '').trim()
  const amount = Number(draft.amount)
  const participantIds = draft.participantIds ?? []

  const errors = {}
  if (!description) errors.description = 'Enter a description.'
  if (!(amount > 0)) errors.amount = 'Enter an amount greater than 0.'
  if (!draft.paidById) errors.paidById = 'Select who paid.'
  if (participantIds.length === 0)
    errors.participantIds = 'Select at least one participant.'

  return {
    errors,
    cleaned: { description, amount, paidById: draft.paidById, participantIds },
  }
}

// Resolves a person by id, falling back to a placeholder for ids that no
// longer map to a known person (e.g. removed mid-edit).
export function personOf(people, id) {
  return people.find((p) => p.id === id) ?? { id, name: '(removed)' }
}
