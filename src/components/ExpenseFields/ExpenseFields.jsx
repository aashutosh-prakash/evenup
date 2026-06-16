import './ExpenseFields.css'

// Module-level (not redefined per render) so its identity is stable and the
// error <span> updates in place instead of remounting on every keystroke.
function FieldError({ id, message }) {
  if (!message) return null
  return (
    <span id={id} className="field-error" role="alert">
      {message}
    </span>
  )
}

// Shared field set for the add form and the inline editor: description, amount,
// "Paid by", and the "Split among" checkboxes, each with consistent
// aria-invalid / aria-describedby error wiring. `idPrefix` keeps the error ids
// unique when several instances (add form + open editors) coexist in the DOM.
// `fieldRefs` is optional ({ description, amount, paidById, participantIds }) so
// the add form can move focus to the first invalid field.
export default function ExpenseFields({
  values,
  errors,
  people,
  onChange,
  onToggleParticipant,
  fieldRefs = {},
  idPrefix = 'expense',
}) {
  const errId = (field) => `${idPrefix}-err-${field}`
  const describedBy = (field) => (errors[field] ? errId(field) : undefined)
  const invalid = (field) => (errors[field] ? 'true' : undefined)

  return (
    <>
      <input
        ref={fieldRefs.description}
        type="text"
        aria-label="Description"
        placeholder="Description"
        value={values.description}
        aria-invalid={invalid('description')}
        aria-describedby={describedBy('description')}
        onChange={(e) => onChange('description', e.target.value)}
      />
      <FieldError id={errId('description')} message={errors.description} />
      <input
        ref={fieldRefs.amount}
        type="number"
        min="0.01"
        step="0.01"
        aria-label="Amount"
        placeholder="Amount"
        value={values.amount}
        aria-invalid={invalid('amount')}
        aria-describedby={describedBy('amount')}
        onChange={(e) => onChange('amount', e.target.value)}
      />
      <FieldError id={errId('amount')} message={errors.amount} />
      <label className="field">
        <span className="field-label">Paid by</span>
        <select
          ref={fieldRefs.paidById}
          className="field-input"
          value={values.paidById}
          aria-invalid={invalid('paidById')}
          aria-describedby={describedBy('paidById')}
          onChange={(e) => onChange('paidById', e.target.value)}
        >
          <option value="">— select —</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <FieldError id={errId('paidById')} message={errors.paidById} />
      <fieldset
        ref={fieldRefs.participantIds}
        tabIndex={-1}
        aria-invalid={invalid('participantIds')}
        aria-describedby={describedBy('participantIds')}
      >
        <legend className="field-label">Split among</legend>
        {people.map((p) => (
          <label key={p.id} className="check">
            <input
              type="checkbox"
              checked={values.participantIds.includes(p.id)}
              onChange={() => onToggleParticipant(p.id)}
            />
            {p.name}
          </label>
        ))}
      </fieldset>
      <FieldError id={errId('participantIds')} message={errors.participantIds} />
    </>
  )
}
