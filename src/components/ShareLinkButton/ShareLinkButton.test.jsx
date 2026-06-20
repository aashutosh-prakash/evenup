import { render, screen, fireEvent } from '@testing-library/react'
import ShareLinkButton from './ShareLinkButton.jsx'

vi.mock('../../lib/share-link.js', () => ({
  buildShareUrl: vi.fn(() => 'https://x/#s=abc'),
  shareLink: vi.fn(() => Promise.resolve('copied')),
}))

import { buildShareUrl, shareLink } from '../../lib/share-link.js'

const state = {
  title: '',
  people: [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ],
  expenses: [{ id: 'e1', amount: 10, paidById: 'p1', participantIds: ['p1', 'p2'] }],
}

describe('ShareLinkButton', () => {
  it('renders nothing until there is an expense', () => {
    const { container } = render(<ShareLinkButton state={{ ...state, expenses: [] }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shares the built url and shows "Link copied" on copied', async () => {
    render(<ShareLinkButton state={state} />)
    fireEvent.click(screen.getByRole('button', { name: /share a link to this split/i }))

    expect(await screen.findByText('Link copied')).toBeInTheDocument()
    expect(buildShareUrl).toHaveBeenCalledWith(state)
    expect(shareLink).toHaveBeenCalledWith('https://x/#s=abc')
  })
})
