# EvenUp

Split shared expenses equally and see who should pay whom to settle up.
Runs entirely in your browser — no login, no server, no tracking. Your data
stays in `localStorage` on your device.

## Features

- **People & expenses** — add people, then expenses (description, amount, who
  paid, who shares it), with equal splitting among the selected participants.
- **Edit inline** — change any expense's description, amount, payer, or split
  members directly in the list.
- **Per-person balances** — each person shows a colored net (green when they're
  owed, red when they owe).
- **Plain-language settlement** — a greedy "who pays whom" summary that keeps
  the transaction count small and always reconciles fully.
- **Share** — one tap copies (or, where supported, shares) a clean text
  summary of who paid what and who should settle up.
- **Name the split** — give the trip/event a title that rides along in the
  shared summary.
- **Installable (PWA)** — add it to your home screen / install it as an app;
  it works offline-friendly since everything runs client-side.
- **Resilient** — corrupt saved data is sanitized on load, and an error
  boundary offers a one-tap "reset data" recovery instead of a blank screen.

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
  lib/                 pure logic: settle math, expense helpers, share text
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
