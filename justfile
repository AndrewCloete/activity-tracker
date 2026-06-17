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

# Save the OpenAPI spec snapshot from the running backend and regenerate frontend types.
# Requires the backend to be running on :3001.
# Run this after any backend route or model change.
gen-types:
    curl -s http://localhost:3001/openapi.json -o openapi.json
    cd frontend && npx openapi-typescript ../openapi.json -o src/api/types.ts

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
