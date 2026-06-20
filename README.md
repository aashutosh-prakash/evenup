# EvenKar

Split shared expenses equally and see who should pay whom to settle up.
Runs entirely in your browser — no login, no server, no tracking. Your data
stays in `localStorage` on your device.

## Features

- **Members & expenses** — add members (rename them inline anytime), then
  expenses (description, amount, who paid, who shares it), with equal splitting
  among the selected participants.
- **Quick descriptions** — one-tap chips (Food, Drinks, Parking, Toll) prefill
  common expense names.
- **Edit inline** — change any expense's description, amount, payer, or split
  members directly in the list; remove a member who isn't used in any expense.
- **Per-person balances** — each member shows a colored net (green when they're
  owed, red when they owe).
- **Plain-language settlement** — a greedy "who pays whom" summary that keeps
  the transaction count small and always reconciles fully.
- **Share** — one tap shares a compressed, read-only **link** to the split (a
  clean view with a "Save a copy to my device" button). The split is encoded in
  the URL hash, so no server ever sees it. When a split is too large to fit in a
  link, it automatically falls back to copying/sharing a plain-text summary.
- **Name the split** — give the trip/event a title that rides along in the
  shared link and summary.
- **Durable storage** — requests persistent storage so the browser won't evict
  your data; on iOS/Safari (where script-written storage can be cleared after
  ~a week unused) a footer note nudges you to install the app or save a copy.
- **Installable (PWA)** — add it to your home screen / install it as an app;
  it works offline-friendly since everything runs client-side.
- **Resilient** — corrupt saved (or shared) data is sanitized on load, and an
  error boundary offers a one-tap "reset data" recovery instead of a blank
  screen.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed URL. Requires **Node 20.19+** (see `.nvmrc`).

## Build a static site

```bash
npm run build
```

The static bundle is written to `dist/` and can be hosted on any static host.
The PWA manifest and icons (`public/`) are copied into the build automatically.

### Recommended security headers

The app needs no server, but when you host the static bundle it's good
practice to set these response headers at your host/CDN (they can't be set
from inside a static bundle):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
```

## Test

```bash
npm test            # run once
npm run test:watch  # watch mode
npm run test:coverage
```

Tests use Vitest + Testing Library (jsdom). Pure logic (`src/lib`, `src/state`)
and every component have their own co-located tests.

## Lint & format

```bash
npm run lint
npm run format        # write
npm run format:check  # CI check
```

CI runs lint, format check, tests, build, and a production-dependency audit on
every push and PR.

## Project structure

```
src/
  components/<Name>/   each component with its .jsx, .css, and .test.jsx
  hooks/               shared React hooks (useExpenseDraft)
  lib/                 pure logic: settle math, expense/avatar helpers, share
                       text + link (encode/compress), platform/storage helpers
  state/               useReducer store + localStorage persistence
  test/                Vitest setup
  App.jsx / App.css    shell, layout, and global styles
public/                favicon, PWA icons, web manifest
```

All money math is done in integer cents (`src/lib/settle.js`) to avoid float
drift; the reducer is the single source of truth and persists one JSON blob to
`localStorage`.

## License

MIT
