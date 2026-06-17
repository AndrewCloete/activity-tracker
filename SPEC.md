# Tracker — Product Spec

## What it is

A personal activity logging app. You create named activities and log numeric entries against them over time.

**Example**: Create a "Pushups" activity. After a workout, select it and log `reps: 20, kgs: 10`. Next time, the form pre-fills with those field names so you just type the new values.

---

## Activities

- A named entity (e.g. "Pushups", "Running").
- The list is sorted by most recently logged, descending.
- Activities can be renamed; the new name applies everywhere because log entries reference the activity by foreign key.
- Activities can be deleted; all their log entries are deleted with them.

---

## Log entries

Each entry belongs to an activity and contains:

- **Timestamp** — defaults to now, but can be overridden at creation and editing.
- **Numeric fields** — one or more labelled values (e.g. `reps: 20`, `kgs: 10`).
- **Comment** — optional free-text note.

### Schema inference

There is no fixed schema. The fields present on the **most recent entry** become the default fields for the next entry. This lets the schema evolve naturally: add a new field to any entry and all subsequent entries will inherit it as a default.

When logging a new entry the form shows the previous entry's fields (with their last values as placeholders) and always allows adding additional fields.

When editing an entry you can change existing field values and add new fields.

### Activity detail view

- Last 10 entries shown in a table, timestamp displayed as relative human time ("2 hours ago").
- Comments shown inline below the timestamp.
- Each entry has **Edit** and **Delete** actions.

---

## Stats

On each activity's detail screen, a period selector (week / month / year) shows:

- **Entry count** over time (bar chart, grouped by day for week/month, by week for year).
- **Sum and average** of each numeric field over the same period (line chart).

---

## Tech constraints

- SQLite schema as simple as possible; JSON column for numeric field values to allow flexible schema evolution.
- OpenAPI spec generated from Rust source (utoipa); frontend TypeScript types regenerated from the running backend via `just gen-types`.
- Minimal dependencies; native HTML elements where possible.
- No CSS framework; inline styles only.
