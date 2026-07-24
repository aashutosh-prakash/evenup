import { render, screen, fireEvent, within } from '@testing-library/react'
import Summary from './Summary.jsx'

const people = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
]

// Alice paid 100 split two ways -> Bob (p2) pays Alice (p1) 50.
const settledState = {
  people,
  title: '',
  paidSettlements: [],
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

describe('Summary', () => {
  it('shows guidance until there is an expense', () => {
    render(<Summary state={{ people, expenses: [], title: '' }} />)
    expect(screen.getByText(/add people and an expense/i)).toBeInTheDocument()
  })

  it('renders paid totals, net balances, and the settlement once there are expenses', () => {
    const state = {
      people,
      title: '',
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
    render(<Summary state={state} />)
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    // Net badges: Alice is owed +50.00, Bob owes -50.00.
    expect(screen.getByText('+50.00')).toBeInTheDocument()
    expect(screen.getByText('-50.00')).toBeInTheDocument()
    // Settlement names appear in the "Settlements" sentence.
    expect(screen.getByText('Settlements')).toBeInTheDocument()
  })

  it('toggles a settlement paid on tap, dispatching its key', () => {
    const dispatch = vi.fn()
    render(<Summary state={settledState} dispatch={dispatch} />)
    const tile = screen.getByRole('button', { name: /Bob pays Alice/i })
    expect(tile).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(tile)
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_SETTLEMENT_PAID',
      key: 'p2::p1::5000',
    })
  })

  it('shows the Paid stamp for a settlement already in paidSettlements', () => {
    const state = { ...settledState, paidSettlements: ['p2::p1::5000'] }
    render(<Summary state={state} dispatch={() => {}} />)
    const tile = screen.getByRole('button', { name: /Bob pays Alice/i })
    expect(tile).toHaveAttribute('aria-pressed', 'true')
    expect(tile).toHaveClass('is-paid')
    expect(within(tile).getByText('Paid')).toBeInTheDocument()
  })
})
