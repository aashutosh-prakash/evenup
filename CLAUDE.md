# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

EvenKar is a local-only PWA for splitting shared expenses — no login, no server, no network calls. Everything runs client-side and persists to `localStorage`. (Vite + React 18, plain JS — no TypeScript.)

## Commands

```bash
npm run dev            # Vite dev server (service worker is OFF in dev)
npm run build          # production build to dist/
npm run preview        # serve the production build locally

npm test               # run all tests once (vitest run)
npm run test:watch     # watch mode
npm run test:coverage  # coverage
npx vitest run src/lib/settle.test.js          # a single test file
npx vitest run -t "returns zero balances"      # tests matching a name

npm run lint           # eslint .
npm run format         # prettier --write .
npm run format:check   # prettier --check . (what CI runs)
```

Requires Node ≥ 20.19. A **husky pre-commit hook runs `lint` + `format:check` + `test`** — commits fail if any fail. CI additionally runs `build` and `npm audit --omit=dev --audit-level=high`. Match Prettier style (**no semicolons, single quotes, 2-space, trailing commas**) or the hook/CI rejects it.

## Architecture

**Single source of truth.** All app state is one object `{ people, expenses, title }` held in a `useReducer` store (`src/state/store.js`) and persisted as **one JSON blob** to `localStorage`. `App.jsx` owns the reducer and a `saveState`-on-change effect.

- `people: [{ id, name, colorIndex }]`, `expenses: [{ id, description, amount, paidById, participantIds, createdAt }]`.
- **Everything references people by `id`, never by name or index** — so renaming a member (`RENAME_PERSON`) can't break expenses, and duplicate names are fine.
- **The reducer is the validation boundary.** Writes go through `normalizeExpenseFields`; reads/imports go through the shared `sanitizeState` (used by both `loadState` and the `REPLACE_STATE` reducer case) — there is intentionally **one** sanitizer, so a future invariant added there applies on every path. `backfillColors` guarantees distinct `colorIndex` per person.
- IDs come from `newId('p'|'e')` (`crypto.randomUUID`, prefixed). Don't generate ids elsewhere.
- ⚠️ The `localStorage` key is **`evenup.state`** (`STORAGE_KEY`). The app was renamed EvenUp → EvenKar but **the key was deliberately kept** so existing users don't lose data — do not change it.

**Money math.** `src/lib/settle.js` does all balance math in **integer cents** to avoid float drift; `settle()` is a greedy who-pays-whom minimizer that always reconciles to zero. Don't reimplement balance math elsewhere — compute via `computeBalances`/`settle`/`computePaidTotals`.

**Sharing (two distinct artifacts).**

- `src/lib/share.js` → `buildSummaryText` builds a human-readable text digest; `shareSummary` does native-share-then-clipboard.
- `src/lib/share-link.js` → a read-only **link** to the split. `encodeSplit` serializes a _compact index-based wire format_ (drops UUIDs, references people by array index), then **lz-string** `compressToEncodedURIComponent` into the URL **hash** (`#s=…`, never a query param, so it's never sent to a server). `decodeSplit` regenerates fresh ids, validates defensively, and returns `null` on garbage **or an empty split** (so a blank crafted link can't render a wipe-the-data view). The single "Share" button (`ShareButton`) prefers the link and falls back to the text summary when too large (`composeShareUrl` returns `null`).
- Opening a `#s=` link makes `App` render `SharedView` (read-only; **never writes the viewer's `localStorage`** — the save effect is gated). "Save a copy" dispatches `REPLACE_STATE`. Read the hash with a manual `s=` parse, **not `URLSearchParams`** — lz-string output can contain `+`, which form-decoding corrupts to a space.

**PWA.** `public/` holds a hand-authored `manifest.webmanifest` + icons. `vite-plugin-pwa` owns **only** the service worker (`manifest: false`, `injectRegister: false`); registration is manual via `PWAUpdater` with `registerType: 'prompt'` (shows an update toast rather than silently reloading). `src/lib/platform.js` requests persistent storage on load and detects the iOS/Safari contexts where storage can be evicted (drives the footer caveat + install nudge).

## Layout & conventions

- `src/components/<Name>/` — each component co-locates `<Name>.jsx`, `<Name>.css`, `<Name>.test.jsx`. Components import their own CSS; global styles + the app shell live in `App.css`.
- `src/lib/` pure logic, `src/state/` the store, `src/hooks/` shared hooks (`useExpenseDraft`), `src/test/setup.js` Vitest setup.
- **Vitest globals are enabled** (`globals: true`) — use `describe`/`it`/`expect`/`vi` **without importing them**; tests run in `jsdom`.
- Workflow is **PR-per-change**: branch off `main`, never commit straight to it. Visual/UI changes are verified in a real browser (Playwright) before committing, not just via tests.
- **Deploy**: there's no `vercel.json` — the project is auto-deployed by Vercel, so a merge to `main` ships to production (`evenkar.vercel.app`). Treat `main` merges as releases.
