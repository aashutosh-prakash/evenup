import { render, screen, fireEvent } from '@testing-library/react'
import ExpenseFields from './ExpenseFields.jsx'

const people = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
]
const emptyValues = { description: '', amount: '', paidById: '', participantIds: [] }

describe('ExpenseFields', () => {
  it('reports field edits via onChange', () => {
    const onChange = vi.fn()
    render(
      <ExpenseFields
        values={emptyValues}
        errors={{}}
        people={people}
        onChange={onChange}
        onToggleParticipant={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Lunch' },
    })
    expect(onChange).toHaveBeenCalledWith('description', 'Lunch')
  })

  it('toggles a participant via onToggleParticipant', () => {
    const onToggle = vi.fn()
    render(
      <ExpenseFields
        values={emptyValues}
        errors={{}}
        people={people}
        onChange={() => {}}
        onToggleParticipant={onToggle}
      />,
    )
    fireEvent.click(screen.getByLabelText('Alice'))
    expect(onToggle).toHaveBeenCalledWith('p1')
  })

  it('wires errors to their field with prefixed ids', () => {
    render(
      <ExpenseFields
        values={emptyValues}
        errors={{ description: 'Enter a description.' }}
        people={people}
        onChange={() => {}}
        onToggleParticipant={() => {}}
        idPrefix="add"
      />,
    )
    const err = screen.getByText('Enter a description.')
    expect(err).toHaveAttribute('id', 'add-err-description')
    expect(screen.getByLabelText('Description')).toHaveAttribute(
      'aria-describedby',
      'add-err-description',
    )
  })
})
