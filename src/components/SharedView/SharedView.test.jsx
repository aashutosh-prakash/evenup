import { render, screen, fireEvent } from '@testing-library/react'
import SharedView from './SharedView.jsx'

const split = {
  title: 'Weekend Trip',
  people: [
    { id: 'p1', name: 'Alice', colorIndex: 0 },
    { id: 'p2', name: 'Bob', colorIndex: 1 },
  ],
  expenses: [
    {
      id: 'e1',
      description: 'Hotel',
      amount: 100,
      paidById: 'p1',
      participantIds: ['p1', 'p2'],
      createdAt: 1,
    },
  ],
}

describe('SharedView', () => {
  it('shows the title, the expense, and both actions', () => {
    render(<SharedView split={split} onSave={() => {}} onExit={() => {}} />)

    // Title sits beside the brand (not as a heading); "Expenses" is the heading.
    expect(screen.getByText('Weekend Trip')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Expenses' })).toBeInTheDocument()
    expect(screen.getByText('Hotel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save a copy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument()
  })

  it('shows expenses read-only (no Edit/Remove or Share)', () => {
    render(<SharedView split={split} onSave={() => {}} onExit={() => {}} />)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /share this split/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onSave when Save a copy is clicked', () => {
    const onSave = vi.fn()
    render(<SharedView split={split} onSave={onSave} onExit={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /save a copy/i }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('calls onExit when Exit is clicked', () => {
    const onExit = vi.fn()
    render(<SharedView split={split} onSave={() => {}} onExit={onExit} />)

    fireEvent.click(screen.getByRole('button', { name: /exit/i }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
