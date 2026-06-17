set shell := ["bash", "-c"]

# Start backend and frontend together
dev:
    #!/usr/bin/env bash
    set -e
    (cd backend && cargo run) &
    (cd frontend && npm run dev) &
    wait

# Start backend only
backend:
    cd backend && cargo run

# Start frontend dev server only
frontend:
    cd frontend && npm run dev

# Generate TypeScript types from the running backend's OpenAPI spec
# Requires the backend to be running on :3001
gen-types:
    cd frontend && npx openapi-typescript http://localhost:3001/openapi.json -o src/api/types.ts

# Install frontend dependencies
install:
    cd frontend && npm install

# Build both for production
build:
    cd frontend && npm run build
    cd backend && cargo build --release

# Run the production backend (serves API; deploy frontend/dist separately or add static serving)
start:
    cd backend && ./target/release/tracker
