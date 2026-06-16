import { useReducer, useEffect } from 'react'
import { reducer, loadState, saveState } from './state/store.js'
import PeoplePanel from './components/PeoplePanel.jsx'
import ExpenseForm from './components/ExpenseForm.jsx'
import ExpenseList from './components/ExpenseList.jsx'
import Summary from './components/Summary.jsx'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <div className="app">
      <header className="app-header">
        <h1>EvenUp</h1>
        <p className="tagline">Split shared expenses and settle up.</p>
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
