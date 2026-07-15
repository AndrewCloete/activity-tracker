use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct FieldValue {
    pub label: String,
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FieldSchema {
    pub label: String,
    pub last_value: f64,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct LogEntry {
    pub id: i64,
    pub activity_id: i64,
    pub logged_at: i64,
    pub values: Vec<FieldValue>,
    pub comment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ActivitySummary {
    pub id: i64,
    pub name: String,
    pub created_at: i64,
    pub last_logged_at: Option<i64>,
    pub entry_count: i64,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ActivityDetail {
    pub id: i64,
    pub name: String,
    pub created_at: i64,
    /// Last 10 entries, most recent first
    pub last_entries: Vec<LogEntry>,
    /// Inferred from last entry; empty if no entries exist yet
    pub field_schema: Vec<FieldSchema>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateActivity {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateEntry {
    pub values: Vec<FieldValue>,
    /// Unix timestamp seconds; omit to default to now
    pub logged_at: Option<i64>,
    pub comment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateEntry {
    pub values: Vec<FieldValue>,
    pub logged_at: i64,
    /// If provided, renames the parent activity (affects all its entries)
    pub activity_name: Option<String>,
    pub comment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum Period {
    Day,
    Week,
    Month,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct DailyCount {
    pub date: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FieldStatPoint {
    pub date: String,
    pub sum: Option<f64>,
    pub avg: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FieldStat {
    pub label: String,
    pub data: Vec<FieldStatPoint>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ActivityStats {
    pub period: String,
    pub counts: Vec<DailyCount>,
    pub field_stats: Vec<FieldStat>,
}
