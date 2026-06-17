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

  it('uses the color-index palette for the background and initials', () => {
    const { container } = render(
      <Avatar person={{ id: 'p1', name: 'Alice Bob', colorIndex: 0 }} />,
    )
    const circle = container.querySelector('circle')
    const text = container.querySelector('text')
    expect(circle.getAttribute('fill')).toBe('#bbdefb')
    expect(text.getAttribute('fill')).toBe('#1565c0')
  })

  it('gives two different color indexes different backgrounds', () => {
    const { container } = render(
      <>
        <Avatar person={{ id: 'p1', name: 'Alice', colorIndex: 0 }} />
        <Avatar person={{ id: 'p2', name: 'Bob', colorIndex: 1 }} />
      </>,
    )
    const fills = [...container.querySelectorAll('circle')].map((c) => c.getAttribute('fill'))
    expect(fills[0]).not.toBe(fills[1])
  })
})
