import { render, screen, fireEvent } from '@testing-library/react'
import ExpenseList from './ExpenseList.jsx'

const state = {
  people: [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ],
  expenses: [
    {
      id: 'e1',
      description: 'Hotel',
      amount: 100,
      paidById: 'p1',
      participantIds: ['p1', 'p2'],
    },
  ],
}

describe('ExpenseList', () => {
  it('shows an empty message with no expenses', () => {
    render(<ExpenseList state={{ people: [], expenses: [] }} dispatch={() => {}} />)
    expect(screen.getByText('No expenses yet.')).toBeInTheDocument()
  })

  it('renders an expense row', () => {
    render(<ExpenseList state={state} dispatch={() => {}} />)
    expect(screen.getByText('Hotel')).toBeInTheDocument()
    expect(screen.getByText('100.00')).toBeInTheDocument()
  })

  it('opens the inline editor via Edit', () => {
    render(<ExpenseList state={state} dispatch={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('asks for confirmation before removing (no dispatch on first click)', () => {
    const dispatch = vi.fn()
    render(<ExpenseList state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(dispatch).not.toHaveBeenCalled()
    expect(screen.getByText('Remove this?')).toBeInTheDocument()
  })

  it('dispatches REMOVE_EXPENSE only after Confirm', () => {
    const dispatch = vi.fn()
    render(<ExpenseList state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_EXPENSE', id: 'e1' })
  })

  it('Cancel aborts the removal', () => {
    const dispatch = vi.fn()
    render(<ExpenseList state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(dispatch).not.toHaveBeenCalled()
    // Back to the default actions.
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
    expect(screen.queryByText('Remove this?')).not.toBeInTheDocument()
  })
})
