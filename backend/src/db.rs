use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use std::collections::BTreeMap;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::models::*;

pub fn init(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS activities (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL UNIQUE,
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS log_entries (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            activity_id INTEGER NOT NULL REFERENCES activities(id),
            logged_at   INTEGER NOT NULL,
            values_json TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_entries_activity_time
            ON log_entries(activity_id, logged_at DESC);
        ",
    )
    .context("init tables")?;
    // Non-destructive migration: add column if this is an existing DB without it
    let _ = conn.execute("ALTER TABLE log_entries ADD COLUMN comment TEXT", []);
    Ok(())
}

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

pub fn list_activities(conn: &Connection) -> Result<Vec<ActivitySummary>> {
    let mut stmt = conn.prepare(
        "SELECT a.id, a.name, a.created_at,
                MAX(e.logged_at) AS last_logged_at,
                COUNT(e.id)     AS entry_count
         FROM activities a
         LEFT JOIN log_entries e ON e.activity_id = a.id
         GROUP BY a.id
         ORDER BY last_logged_at DESC, a.created_at DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(ActivitySummary {
            id: row.get(0)?,
            name: row.get(1)?,
            created_at: row.get(2)?,
            last_logged_at: row.get(3)?,
            entry_count: row.get(4)?,
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(Into::into)
}

pub fn create_activity(conn: &Connection, name: &str) -> Result<ActivitySummary> {
    let ts = now();
    conn.execute(
        "INSERT INTO activities (name, created_at) VALUES (?1, ?2)",
        params![name, ts],
    )?;
    Ok(ActivitySummary {
        id: conn.last_insert_rowid(),
        name: name.to_string(),
        created_at: ts,
        last_logged_at: None,
        entry_count: 0,
    })
}

pub fn get_activity(conn: &Connection, id: i64) -> Result<Option<ActivityDetail>> {
    let row = conn.query_row(
        "SELECT id, name, created_at FROM activities WHERE id = ?1",
        params![id],
        |r| Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?, r.get::<_, i64>(2)?)),
    );

    let (act_id, name, created_at) = match row {
        Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(None),
        r => r?,
    };

    let mut stmt = conn.prepare(
        "SELECT id, activity_id, logged_at, values_json, comment
         FROM log_entries
         WHERE activity_id = ?1
         ORDER BY logged_at DESC
         LIMIT 10",
    )?;

    let entries: Vec<LogEntry> = stmt
        .query_map(params![act_id], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, i64>(1)?,
                r.get::<_, i64>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, Option<String>>(4)?,
            ))
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?
        .into_iter()
        .map(|(id, activity_id, logged_at, values_json, comment)| LogEntry {
            id,
            activity_id,
            logged_at,
            values: serde_json::from_str(&values_json).unwrap_or_default(),
            comment,
        })
        .collect();

    let field_schema = entries
        .first()
        .map(|e| {
            e.values
                .iter()
                .map(|v| FieldSchema {
                    label: v.label.clone(),
                    last_value: v.value,
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(Some(ActivityDetail {
        id: act_id,
        name,
        created_at,
        last_entries: entries,
        field_schema,
    }))
}

pub fn create_entry(
    conn: &Connection,
    activity_id: i64,
    values: Vec<FieldValue>,
    logged_at: Option<i64>,
    comment: Option<String>,
) -> Result<LogEntry> {
    let ts = logged_at.unwrap_or_else(now);
    let json = serde_json::to_string(&values)?;
    conn.execute(
        "INSERT INTO log_entries (activity_id, logged_at, values_json, comment) VALUES (?1, ?2, ?3, ?4)",
        params![activity_id, ts, json, comment],
    )?;
    Ok(LogEntry {
        id: conn.last_insert_rowid(),
        activity_id,
        logged_at: ts,
        values,
        comment,
    })
}

pub fn update_entry(
    conn: &Connection,
    activity_id: i64,
    entry_id: i64,
    body: &UpdateEntry,
) -> Result<Option<LogEntry>> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM log_entries WHERE id = ?1 AND activity_id = ?2",
        params![entry_id, activity_id],
        |r| r.get(0),
    )?;
    if count == 0 {
        return Ok(None);
    }

    if let Some(ref name) = body.activity_name {
        conn.execute(
            "UPDATE activities SET name = ?1 WHERE id = ?2",
            params![name, activity_id],
        )?;
    }

    let values_json = serde_json::to_string(&body.values)?;
    conn.execute(
        "UPDATE log_entries SET logged_at = ?1, values_json = ?2, comment = ?3 WHERE id = ?4",
        params![body.logged_at, values_json, body.comment, entry_id],
    )?;

    Ok(Some(LogEntry {
        id: entry_id,
        activity_id,
        logged_at: body.logged_at,
        values: body.values.clone(),
        comment: body.comment.clone(),
    }))
}

pub fn rename_activity(conn: &Connection, id: i64, name: &str) -> Result<bool> {
    let n = conn.execute(
        "UPDATE activities SET name = ?1 WHERE id = ?2",
        params![name, id],
    )?;
    Ok(n > 0)
}

pub fn delete_activity(conn: &Connection, id: i64) -> Result<bool> {
    conn.execute("DELETE FROM log_entries WHERE activity_id = ?1", params![id])?;
    let n = conn.execute("DELETE FROM activities WHERE id = ?1", params![id])?;
    Ok(n > 0)
}

pub fn delete_entry(conn: &Connection, activity_id: i64, entry_id: i64) -> Result<bool> {
    let n = conn.execute(
        "DELETE FROM log_entries WHERE id = ?1 AND activity_id = ?2",
        params![entry_id, activity_id],
    )?;
    Ok(n > 0)
}

pub fn get_stats(conn: &Connection, activity_id: i64, period: &Period) -> Result<ActivityStats> {
    let ts = now();
    let (cutoff, fmt) = match period {
        Period::Week => (ts - 7 * 86400, "%Y-%m-%d"),
        Period::Month => (ts - 30 * 86400, "%Y-%m-%d"),
        // year view groups by week to keep data points manageable
        Period::Year => (ts - 365 * 86400, "%Y-W%W"),
    };
    let period_str = match period {
        Period::Week => "week",
        Period::Month => "month",
        Period::Year => "year",
    };

    let count_sql = format!(
        "SELECT strftime('{fmt}', logged_at, 'unixepoch') AS bucket, COUNT(*) AS cnt
         FROM log_entries
         WHERE activity_id = ?1 AND logged_at >= ?2
         GROUP BY bucket ORDER BY bucket"
    );
    let mut stmt = conn.prepare(&count_sql)?;
    let counts: Vec<DailyCount> = stmt
        .query_map(params![activity_id, cutoff], |r| {
            Ok(DailyCount {
                date: r.get(0)?,
                count: r.get(1)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    let field_sql = format!(
        "SELECT strftime('{fmt}', e.logged_at, 'unixepoch') AS bucket,
                json_extract(v.value, '$.label')             AS label,
                SUM(CAST(json_extract(v.value, '$.value') AS REAL)) AS s,
                AVG(CAST(json_extract(v.value, '$.value') AS REAL)) AS a
         FROM log_entries e, json_each(e.values_json) AS v
         WHERE e.activity_id = ?1 AND e.logged_at >= ?2
         GROUP BY bucket, label
         ORDER BY label, bucket"
    );
    let mut stmt = conn.prepare(&field_sql)?;
    let raw: Vec<(String, String, f64, f64)> = stmt
        .query_map(params![activity_id, cutoff], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    let mut by_label: BTreeMap<String, Vec<FieldStatPoint>> = BTreeMap::new();
    for (date, label, sum, avg) in raw {
        by_label
            .entry(label)
            .or_default()
            .push(FieldStatPoint { date, sum, avg });
    }

    Ok(ActivityStats {
        period: period_str.to_string(),
        counts,
        field_stats: by_label
            .into_iter()
            .map(|(label, data)| FieldStat { label, data })
            .collect(),
    })
}
