import { render, screen } from '@testing-library/react'
import Summary from './Summary.jsx'

const people = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
]

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
})
