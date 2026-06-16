import { render, screen, fireEvent } from '@testing-library/react'
import ShareButton from './ShareButton.jsx'

const state = {
  title: '',
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

describe('ShareButton', () => {
  it('renders nothing without expenses', () => {
    const { container } = render(<ShareButton state={{ ...state, expenses: [] }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('copies the summary to the clipboard when share is unavailable', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<ShareButton state={state} />)
    fireEvent.click(screen.getByRole('button', { name: /share summary/i }))

    expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument()
    expect(writeText).toHaveBeenCalled()
  })
})
