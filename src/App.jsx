import { useReducer, useEffect, useState } from 'react'
import { reducer, loadState, saveState } from './state/store.js'
import { MIN_PEOPLE } from './lib/expense.js'
import PeoplePanel from './components/PeoplePanel/PeoplePanel.jsx'
import ExpenseForm from './components/ExpenseForm/ExpenseForm.jsx'
import ExpenseList from './components/ExpenseList/ExpenseList.jsx'
import Summary from './components/Summary/Summary.jsx'
import ClearDataButton from './components/ClearDataButton/ClearDataButton.jsx'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    setSaveFailed(!saveState(state))
  }, [state])

  // Dim the expenses column during onboarding — before there are enough people
  // AND before any expense exists. Once an expense is entered it stays fully
  // visible/editable even if people later drop below the minimum.
  const expensesLocked = state.people.length < MIN_PEOPLE && state.expenses.length === 0

  return (
    <div className="app">
      {saveFailed && (
        <div className="save-warning" role="alert">
          Couldn&apos;t save your changes — storage is full or disabled. Recent edits may
          be lost when you reload this page.
        </div>
      )}
      <header className="app-header">
        <div className="app-title">
          <div className="brand-row">
            <h1>EvenUp</h1>
            <input
              type="text"
              className="title-input"
              aria-label="Name this split"
              placeholder="Name this split"
              value={state.title}
              onChange={(e) => dispatch({ type: 'SET_TITLE', title: e.target.value })}
            />
          </div>
          <p className="tagline">Split shared expenses and settle up.</p>
        </div>
        <ClearDataButton state={state} dispatch={dispatch} />
      </header>

      <main className="panels">
        <PeoplePanel state={state} dispatch={dispatch} />
        <section className={`expenses${expensesLocked ? ' is-upcoming' : ''}`}>
          <ExpenseForm state={state} dispatch={dispatch} />
          <ExpenseList state={state} dispatch={dispatch} />
        </section>
        <Summary state={state} />
      </main>
    </div>
  )
}
