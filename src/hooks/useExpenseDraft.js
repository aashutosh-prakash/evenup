import { useState } from 'react'

// Shared draft state + field handlers for the add form and the inline editor,
// so the two never drift. `values` holds { description, amount, paidById,
// participantIds }; editing a field clears just that field's error.
export function useExpenseDraft(initial) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function toggleParticipant(id) {
    setValues((v) => ({
      ...v,
      participantIds: v.participantIds.includes(id)
        ? v.participantIds.filter((p) => p !== id)
        : [...v.participantIds, id],
    }))
    setErrors((e) => ({ ...e, participantIds: undefined }))
  }

  return { values, setValues, errors, setErrors, update, toggleParticipant }
}
