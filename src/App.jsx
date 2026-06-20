import { useReducer, useEffect, useState } from 'react'
import { reducer, loadState, saveState } from './state/store.js'
import { MIN_PEOPLE } from './lib/expense.js'
import { requestPersistentStorage } from './lib/platform.js'
import { readSharedFromHash } from './lib/share-link.js'
import Logo from './components/Logo/Logo.jsx'
import PeoplePanel from './components/PeoplePanel/PeoplePanel.jsx'
import ExpenseForm from './components/ExpenseForm/ExpenseForm.jsx'
import ExpenseList from './components/ExpenseList/ExpenseList.jsx'
import Summary from './components/Summary/Summary.jsx'
import SharedView from './components/SharedView/SharedView.jsx'
import ClearDataButton from './components/ClearDataButton/ClearDataButton.jsx'
import AppFooter from './components/AppFooter/AppFooter.jsx'
import PWAUpdater from './components/PWAUpdater/PWAUpdater.jsx'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [saveFailed, setSaveFailed] = useState(false)
  // A non-null value means the app was opened via a share link (#s=…); we then
  // show a read-only view of that split instead of the editor.
  const [shared, setShared] = useState(readSharedFromHash)

  useEffect(() => {
    setSaveFailed(!saveState(state))
  }, [state])

  // Re-read the hash if it changes while open (e.g. pasting another link).
  useEffect(() => {
    function onHashChange() {
      setShared(readSharedFromHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function exitShared() {
    // Drop the #s=… fragment so a reload returns to the user's own split.
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setShared(null)
  }

  function saveSharedCopy() {
    const hasData = state.people.length > 0 || state.expenses.length > 0
    if (
      hasData &&
      !window.confirm('This replaces your current split. Save the shared copy anyway?')
    ) {
      return
    }
    dispatch({ type: 'REPLACE_STATE', state: shared })
    exitShared()
  }

  // Ask the browser to keep our localStorage exempt from automatic eviction.
  // Best-effort and one-shot; granted on Chromium/Gecko and installed web apps.
  useEffect(() => {
    requestPersistentStorage()
  }, [])

  // Dim the expenses column during onboarding — before there are enough people
  // AND before any expense exists. Once an expense is entered it stays fully
  // visible/editable even if people later drop below the minimum.
  const expensesLocked = state.people.length < MIN_PEOPLE && state.expenses.length === 0

  // A share link takes over the whole screen with a read-only view. Placed
  // after all hooks so hook order stays stable across renders.
  if (shared) {
    return <SharedView split={shared} onSave={saveSharedCopy} onExit={exitShared} />
  }

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
            <span className="brand-name">
              <Logo />
              <h1>EvenKar</h1>
            </span>
            <input
              type="text"
              name="split-title"
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

      <AppFooter />
      <PWAUpdater />
    </div>
  )
}
