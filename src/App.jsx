import { useReducer, useEffect } from 'react'
import { reducer, loadState, saveState } from './state/store.js'
import PeoplePanel from './components/PeoplePanel.jsx'
import ExpenseForm from './components/ExpenseForm.jsx'
import ExpenseList from './components/ExpenseList.jsx'
import Summary from './components/Summary.jsx'
import ClearDataButton from './components/ClearDataButton.jsx'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>EvenUp</h1>
          <p className="tagline">Split shared expenses and settle up.</p>
          <input
            type="text"
            className="title-input"
            aria-label="Name this split"
            placeholder="Name this split (e.g. Goa Trip)"
            value={state.title}
            onChange={(e) => dispatch({ type: 'SET_TITLE', title: e.target.value })}
          />
        </div>
        <ClearDataButton state={state} dispatch={dispatch} />
      </header>

      <main className="panels">
        <PeoplePanel state={state} dispatch={dispatch} />
        <section className="expenses">
          <ExpenseForm state={state} dispatch={dispatch} />
          <ExpenseList state={state} dispatch={dispatch} />
        </section>
        <Summary state={state} />
      </main>
    </div>
  )
}
