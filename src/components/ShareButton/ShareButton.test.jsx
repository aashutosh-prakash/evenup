import { render, screen, fireEvent } from '@testing-library/react'
import ShareButton from './ShareButton.jsx'

vi.mock('../../lib/share-link.js', () => ({
  composeShareUrl: vi.fn(),
  shareLink: vi.fn(() => Promise.resolve('copied')),
}))
vi.mock('../../lib/share.js', () => ({
  buildSummaryText: vi.fn(() => 'summary text'),
  shareSummary: vi.fn(() => Promise.resolve('copied')),
}))

import { composeShareUrl, shareLink } from '../../lib/share-link.js'
import { shareSummary } from '../../lib/share.js'

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

  it('shares the link when it composes, showing "Link copied"', async () => {
    composeShareUrl.mockReturnValue('https://x/#s=abc')
    render(<ShareButton state={state} />)
    fireEvent.click(screen.getByRole('button', { name: /share this split/i }))

    expect(await screen.findByText('Link copied')).toBeInTheDocument()
    expect(shareLink).toHaveBeenCalledWith('https://x/#s=abc')
    expect(shareSummary).not.toHaveBeenCalled()
  })

  it('falls back to the text summary when the link cannot be composed', async () => {
    composeShareUrl.mockReturnValue(null)
    render(<ShareButton state={state} />)
    fireEvent.click(screen.getByRole('button', { name: /share this split/i }))

    expect(await screen.findByText('Summary copied')).toBeInTheDocument()
    expect(shareSummary).toHaveBeenCalledWith('summary text')
  })
})
