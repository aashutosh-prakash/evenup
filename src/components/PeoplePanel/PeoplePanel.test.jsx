import { render, screen, fireEvent } from '@testing-library/react'
import PeoplePanel from './PeoplePanel.jsx'

describe('PeoplePanel', () => {
  it('prompts to add people when empty', () => {
    render(<PeoplePanel state={{ people: [], expenses: [] }} dispatch={() => {}} />)
    expect(screen.getByText(/add at least 2 people/i)).toBeInTheDocument()
  })

  it('dispatches ADD_PERSON with the trimmed name', () => {
    const dispatch = vi.fn()
    render(<PeoplePanel state={{ people: [], expenses: [] }} dispatch={dispatch} />)
    fireEvent.change(screen.getByPlaceholderText('Add a person'), {
      target: { value: '  Carol  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'ADD_PERSON', name: 'Carol' })
  })

  it('refuses to remove a person who is in an expense, showing a notice', () => {
    const dispatch = vi.fn()
    const state = {
      people: [{ id: 'p1', name: 'Alice' }],
      expenses: [{ id: 'e1', paidById: 'p1', participantIds: ['p1'] }],
    }
    render(<PeoplePanel state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /remove alice/i }))
    expect(screen.getByText(/can't remove alice/i)).toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('renames a person inline, dispatching RENAME_PERSON with the trimmed name', () => {
    const dispatch = vi.fn()
    const state = { people: [{ id: 'p1', name: 'Alice' }], expenses: [] }
    render(<PeoplePanel state={state} dispatch={dispatch} />)

    fireEvent.click(screen.getByRole('button', { name: /rename alice/i }))
    const input = screen.getByRole('textbox', { name: /edit name for alice/i })
    fireEvent.change(input, { target: { value: '  Alicia  ' } })
    fireEvent.click(screen.getByRole('button', { name: /save name/i }))

    expect(dispatch).toHaveBeenCalledWith({
      type: 'RENAME_PERSON',
      id: 'p1',
      name: 'Alicia',
    })
  })
})
