import { render, screen, fireEvent } from '@testing-library/react'
import ExpenseForm from './ExpenseForm.jsx'

const twoPeople = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
]

describe('ExpenseForm', () => {
  it('prompts for more people until there are at least two', () => {
    render(
      <ExpenseForm
        state={{ people: [{ id: 'p1', name: 'Alice' }], expenses: [] }}
        dispatch={() => {}}
      />,
    )
    expect(screen.getByText(/add one more person/i)).toBeInTheDocument()
  })

  it('shows inline validation errors on an empty submit', () => {
    render(<ExpenseForm state={{ people: twoPeople, expenses: [] }} dispatch={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(screen.getByText('Enter a description.')).toBeInTheDocument()
    expect(screen.getByText('Enter an amount greater than 0.')).toBeInTheDocument()
    expect(screen.getByText('Select who paid.')).toBeInTheDocument()
  })

  it('dispatches ADD_EXPENSE for a valid submit', () => {
    const dispatch = vi.fn()
    render(
      <ExpenseForm state={{ people: twoPeople, expenses: [] }} dispatch={dispatch} />,
    )
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Lunch' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('Paid by'), { target: { value: 'p1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_EXPENSE',
        description: 'Lunch',
        amount: 20,
        paidById: 'p1',
        participantIds: ['p1', 'p2'],
      }),
    )
  })

  it('reflects participant toggles in the dispatched expense', () => {
    const dispatch = vi.fn()
    render(
      <ExpenseForm state={{ people: twoPeople, expenses: [] }} dispatch={dispatch} />,
    )
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Lunch' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('Paid by'), { target: { value: 'p1' } })
    // Both are auto-selected on mount; uncheck Bob.
    fireEvent.click(screen.getByLabelText('Bob'))
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ participantIds: ['p1'] }),
    )
  })

  it('shows the participants error when everyone is unchecked', () => {
    render(<ExpenseForm state={{ people: twoPeople, expenses: [] }} dispatch={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Alice'))
    fireEvent.click(screen.getByLabelText('Bob'))
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(screen.getByText('Select at least one participant.')).toBeInTheDocument()
  })
})
