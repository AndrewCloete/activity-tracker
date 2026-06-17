# Agent instructions

## Project layout

```
backend/   Rust · Axum · rusqlite — the API server
frontend/  React · TypeScript · Vite — the client
openapi.json  committed spec snapshot — the API contract
justfile   all build/dev commands
```

## The OpenAPI boundary

`openapi.json` is the **single interface between backend and frontend**.  
It is generated from Rust source (utoipa derives) and committed to the repo.

**Frontend agents** — read `openapi.json` to understand available endpoints,
request/response shapes, and field names. Do not read Rust source files unless
the task is explicitly about the backend.

**Backend agents** — after any change to routes or models, regenerate the
snapshot so frontend agents stay in sync:

```sh
just backend    # start the backend
just gen-types  # saves openapi.json + regenerates frontend/src/api/types.ts
```

## Task playbooks

### Backend change
1. Edit Rust (`backend/src/models.rs`, `db.rs`, `main.rs`)
2. `cargo check` inside `backend/`
3. Start backend and run `just gen-types` to update `openapi.json` and TypeScript types
4. Commit `openapi.json` alongside the Rust changes

### Frontend change
1. Read `openapi.json` for the current API contract
2. Read `frontend/src/api/types.ts` for the generated TypeScript types
3. Edit frontend code; verify with `tsc --noEmit` inside `frontend/`

### Full-stack change
Follow both playbooks above in order (backend first, gen-types, then frontend).

## Key commands

| Command | What it does |
|---|---|
| `just dev` | Backend (:3001) + frontend (:5173) together |
| `just backend` | Backend only |
| `just frontend` | Frontend dev server only |
| `just gen-types` | Fetch spec from running backend → save `openapi.json` + regenerate `frontend/src/api/types.ts` |
| `just install` | `npm install` for frontend |
| `just build` | Production build of both |
