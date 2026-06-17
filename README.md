# Tracker

A personal activity logging app. Create activities (e.g. "Pushups"), log numeric entries against them (e.g. `reps: 20, kgs: 10`), and track trends over time.

## Stack

- **Backend**: Rust + Axum + SQLite (via rusqlite)
- **Frontend**: React + TypeScript + Vite + Recharts
- **API contract**: OpenAPI spec generated from Rust via utoipa, served at `http://localhost:3001/openapi.json`

## Getting started

```sh
# Install frontend dependencies (first time only)
just install

# Run backend and frontend together
just dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- OpenAPI spec: http://localhost:3001/openapi.json

## Other commands

```sh
just backend      # backend only
just frontend     # frontend dev server only
just gen-types    # regenerate src/api/types.ts from running backend
just build        # production build of both
```
