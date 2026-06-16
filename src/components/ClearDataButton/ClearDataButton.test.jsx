import { render, screen, fireEvent } from '@testing-library/react'
import ClearDataButton from './ClearDataButton.jsx'

const withData = { people: [{ id: 'p1', name: 'A' }], expenses: [], title: '' }

describe('ClearDataButton', () => {
  it('renders nothing when there is no data', () => {
    const { container } = render(
      <ClearDataButton
        state={{ people: [], expenses: [], title: '' }}
        dispatch={() => {}}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('requires a two-step confirmation before dispatching CLEAR_ALL', () => {
    const dispatch = vi.fn()
    render(<ClearDataButton state={withData} dispatch={dispatch} />)

    fireEvent.click(screen.getByText('Clear all data'))
    // Armed, but nothing dispatched yet.
    expect(dispatch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Yes, clear everything'))
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_ALL' })
  })

  it('can be cancelled without dispatching', () => {
    const dispatch = vi.fn()
    render(<ClearDataButton state={withData} dispatch={dispatch} />)
    fireEvent.click(screen.getByText('Clear all data'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(dispatch).not.toHaveBeenCalled()
    expect(screen.getByText('Clear all data')).toBeInTheDocument()
  })
})
