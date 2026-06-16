# EvenUp

Split shared expenses equally and see who should pay whom to settle up.
Runs entirely in your browser — no login, no server, no tracking. Your data
stays in `localStorage` on your device.

## Features

- Add people and expenses (description, amount, who paid, who shares it)
- Equal splitting among the selected participants
- Live per-person balances
- Simplified "who pays whom" settlement (fewest transactions)

## Run locally

```bash
npm install
npm run dev
```

Then open the printed URL.

## Build a static site

```bash
npm run build
```

The static bundle is written to `dist/` and can be hosted on any static host.

## Test

```bash
npm test
```

## License

MIT
