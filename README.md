# Arpi Moradi Invoice — Full Stack

Professional invoice generator for Arpi Moradi, RN (Home Health) with a built-in dashboard, server-side persistence, and automatic backups.

## What's inside

- **Frontend** — React 19 + Vite + Tailwind. Invoice editor with PDF export, AI-powered "Magic Add" via Gemini, drag-and-drop line items, customer manager.
- **Backend** — Express server with SQLite (`data.db`) for invoices, customers, and statuses. Auto-snapshot backups in `backups/` (rolling 30).
- **Dashboard** — Open invoices, revenue (YTD + lifetime), monthly trend, status breakdown, top clients, recent activity, backup management.

## Run locally

```bash
npm install
# 1. Set GEMINI_API_KEY in .env.local (for AI Magic Add and Polish)
npm run build       # build the Vite app into dist/
npm run server      # start the Express API + serve the built UI at http://localhost:5000
```

Alternatively, for hot reload during frontend dev:

```bash
npm run dev    # Vite dev server on :3000 (proxy /api manually if needed)
npm run server # API on :5000
```

## API

- `GET /api/health` — liveness check
- `GET /api/invoices`, `PUT /api/invoices/:id`, `PATCH /api/invoices/:id/status`, `DELETE /api/invoices/:id`
- `GET /api/customers`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`
- `POST /api/sync` — bulk push of `{ invoices, customers }`
- `GET /api/stats` — dashboard aggregates
- `GET /api/backups`, `POST /api/backups/run`, `GET /api/backups/download/latest.db`
- `GET /api/export.json` — full JSON export

## Storage & backup

- Primary store: SQLite file `data.db` in the project root (`pplx.app` automatically preserves this file across redeploys).
- Backups: written into `backups/` after every write (debounced 5s) and once per day. Latest 30 are kept.
- Frontend keeps a localStorage copy too, so it works offline; on next connect, it syncs up via `POST /api/sync`.

## Deployment

This project is configured for one-click publish to `*.pplx.app`. Static frontend lives in `dist/`; backend runs from `server/index.js` on port 5000.
