import { render, screen, fireEvent } from '@testing-library/react'
import ExpenseEditRow from './ExpenseEditRow.jsx'

const people = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
]
const expense = {
  id: 'e1',
  description: 'Hotel',
  amount: 100,
  paidById: 'p1',
  participantIds: ['p1', 'p2'],
}

describe('ExpenseEditRow', () => {
  it('pre-fills the expense and saves cleaned edits', () => {
    const onSave = vi.fn()
    render(
      <ExpenseEditRow
        expense={expense}
        people={people}
        onSave={onSave}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByLabelText('Description')).toHaveValue('Hotel')
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSave).toHaveBeenCalledWith({
      description: 'Hotel',
      amount: 60,
      paidById: 'p1',
      participantIds: ['p1', 'p2'],
    })
  })

  it('cancels without saving', () => {
    const onCancel = vi.fn()
    const onSave = vi.fn()
    render(
      <ExpenseEditRow
        expense={expense}
        people={people}
        onSave={onSave}
        onCancel={onCancel}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })
})
