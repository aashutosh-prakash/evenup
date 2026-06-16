import { render, screen } from '@testing-library/react'
import Avatar from './Avatar.jsx'

describe('Avatar', () => {
  it('shows two-letter initials for a full name', () => {
    render(<Avatar person={{ id: 'p1', name: 'Alice Bob', colorIndex: 0 }} />)
    expect(screen.getByText('AB')).toBeInTheDocument()
  })

  it('exposes the name via aria-label', () => {
    render(<Avatar person={{ id: 'p1', name: 'Alice', colorIndex: 1 }} />)
    expect(screen.getByLabelText('Alice')).toBeInTheDocument()
  })

  it('renders without a stored colorIndex (derives one from the id)', () => {
    render(<Avatar person={{ id: 'p9', name: 'Zoe' }} />)
    expect(screen.getByText('Z')).toBeInTheDocument()
  })
})
