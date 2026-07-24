import { render, screen, fireEvent, within } from '@testing-library/react'
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
    const confirm = screen.getByRole('group', { name: 'Confirm removal' })
    // Prompt names the expense being removed.
    expect(within(confirm).getByText('Hotel')).toBeInTheDocument()
  })

  it('dispatches REMOVE_EXPENSE only after confirming', () => {
    const dispatch = vi.fn()
    render(<ExpenseList state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    // The confirm prompt's own Remove button (within the confirm group).
    const confirm = screen.getByRole('group', { name: 'Confirm removal' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Remove' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_EXPENSE', id: 'e1' })
  })

  it('Cancel aborts the removal', () => {
    const dispatch = vi.fn()
    render(<ExpenseList state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(dispatch).not.toHaveBeenCalled()
    // Back to the default row actions.
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Confirm removal' }),
    ).not.toBeInTheDocument()
  })
})
