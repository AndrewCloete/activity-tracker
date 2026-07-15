use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put},
    Router,
};
use rusqlite::Connection;
use serde::Deserialize;
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;
use utoipa::OpenApi;

mod db;
mod models;
use models::*;

#[derive(Clone)]
struct AppState {
    db: Arc<Mutex<Connection>>,
}

#[derive(OpenApi)]
#[openapi(
    paths(
        list_activities,
        create_activity,
        get_activity,
        create_entry,
        update_entry,
        rename_activity,
        delete_activity,
        delete_entry,
        get_stats,
    ),
    components(schemas(
        ActivitySummary,
        CreateActivity,
        ActivityDetail,
        LogEntry,
        FieldValue,
        FieldSchema,
        CreateEntry,
        UpdateEntry,
        Period,
        ActivityStats,
        DailyCount,
        FieldStat,
        FieldStatPoint,
    ))
)]
struct ApiDoc;

#[utoipa::path(
    get,
    path = "/activities",
    responses((status = 200, body = Vec<ActivitySummary>))
)]
async fn list_activities(
    State(s): State<AppState>,
) -> Result<Json<Vec<ActivitySummary>>, StatusCode> {
    let conn = s.db.lock().unwrap();
    db::list_activities(&conn)
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[utoipa::path(
    post,
    path = "/activities",
    request_body = CreateActivity,
    responses((status = 201, body = ActivitySummary))
)]
async fn create_activity(
    State(s): State<AppState>,
    Json(body): Json<CreateActivity>,
) -> Result<(StatusCode, Json<ActivitySummary>), StatusCode> {
    let conn = s.db.lock().unwrap();
    db::create_activity(&conn, &body.name)
        .map(|a| (StatusCode::CREATED, Json(a)))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[utoipa::path(
    get,
    path = "/activities/{id}",
    params(("id" = i64, Path, description = "Activity ID")),
    responses(
        (status = 200, body = ActivityDetail),
        (status = 404, description = "Not found")
    )
)]
async fn get_activity(
    State(s): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<ActivityDetail>, StatusCode> {
    let conn = s.db.lock().unwrap();
    match db::get_activity(&conn, id) {
        Ok(Some(a)) => Ok(Json(a)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    post,
    path = "/activities/{id}/entries",
    params(("id" = i64, Path, description = "Activity ID")),
    request_body = CreateEntry,
    responses((status = 201, body = LogEntry))
)]
async fn create_entry(
    State(s): State<AppState>,
    Path(id): Path<i64>,
    Json(body): Json<CreateEntry>,
) -> Result<(StatusCode, Json<LogEntry>), StatusCode> {
    let conn = s.db.lock().unwrap();
    db::create_entry(&conn, id, body.values, body.logged_at, body.comment)
        .map(|e| (StatusCode::CREATED, Json(e)))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[utoipa::path(
    put,
    path = "/activities/{activity_id}/entries/{entry_id}",
    params(
        ("activity_id" = i64, Path, description = "Activity ID"),
        ("entry_id" = i64, Path, description = "Entry ID"),
    ),
    request_body = UpdateEntry,
    responses(
        (status = 200, body = LogEntry),
        (status = 404, description = "Not found")
    )
)]
async fn update_entry(
    State(s): State<AppState>,
    Path((activity_id, entry_id)): Path<(i64, i64)>,
    Json(body): Json<UpdateEntry>,
) -> Result<Json<LogEntry>, StatusCode> {
    let conn = s.db.lock().unwrap();
    match db::update_entry(&conn, activity_id, entry_id, &body) {
        Ok(Some(e)) => Ok(Json(e)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    patch,
    path = "/activities/{id}",
    params(("id" = i64, Path, description = "Activity ID")),
    request_body = CreateActivity,
    responses(
        (status = 204, description = "Renamed"),
        (status = 404, description = "Not found")
    )
)]
async fn rename_activity(
    State(s): State<AppState>,
    Path(id): Path<i64>,
    Json(body): Json<CreateActivity>,
) -> StatusCode {
    let conn = s.db.lock().unwrap();
    match db::rename_activity(&conn, id, &body.name) {
        Ok(true) => StatusCode::NO_CONTENT,
        Ok(false) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[utoipa::path(
    delete,
    path = "/activities/{id}",
    params(("id" = i64, Path, description = "Activity ID")),
    responses(
        (status = 204, description = "Deleted"),
        (status = 404, description = "Not found")
    )
)]
async fn delete_activity(State(s): State<AppState>, Path(id): Path<i64>) -> StatusCode {
    let conn = s.db.lock().unwrap();
    match db::delete_activity(&conn, id) {
        Ok(true) => StatusCode::NO_CONTENT,
        Ok(false) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[utoipa::path(
    delete,
    path = "/activities/{activity_id}/entries/{entry_id}",
    params(
        ("activity_id" = i64, Path, description = "Activity ID"),
        ("entry_id" = i64, Path, description = "Entry ID"),
    ),
    responses(
        (status = 204, description = "Deleted"),
        (status = 404, description = "Not found")
    )
)]
async fn delete_entry(
    State(s): State<AppState>,
    Path((activity_id, entry_id)): Path<(i64, i64)>,
) -> StatusCode {
    let conn = s.db.lock().unwrap();
    match db::delete_entry(&conn, activity_id, entry_id) {
        Ok(true) => StatusCode::NO_CONTENT,
        Ok(false) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[derive(Deserialize)]
struct StatsQuery {
    period: Period,
}

#[utoipa::path(
    get,
    path = "/activities/{id}/stats",
    params(
        ("id" = i64, Path, description = "Activity ID"),
        ("period" = String, Query, description = "day | week | month")
    ),
    responses((status = 200, body = ActivityStats))
)]
async fn get_stats(
    State(s): State<AppState>,
    Path(id): Path<i64>,
    Query(q): Query<StatsQuery>,
) -> Result<Json<ActivityStats>, StatusCode> {
    let conn = s.db.lock().unwrap();
    db::get_stats(&conn, id, &q.period)
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let conn = Connection::open("tracker.db")?;
    db::init(&conn)?;

    let state = AppState {
        db: Arc::new(Mutex::new(conn)),
    };

    let spec = ApiDoc::openapi().to_json().expect("openapi serialization");

    let app = Router::new()
        .route("/activities", get(list_activities).post(create_activity))
        .route("/activities/:id", get(get_activity).patch(rename_activity).delete(delete_activity))
        .route("/activities/:id/entries", post(create_entry))
        .route(
            "/activities/:activity_id/entries/:entry_id",
            put(update_entry).delete(delete_entry),
        )
        .route("/activities/:id/stats", get(get_stats))
        .route(
            "/openapi.json",
            get({
                let spec = spec.clone();
                move || async move {
                    (
                        [(
                            axum::http::header::CONTENT_TYPE,
                            "application/json; charset=utf-8",
                        )],
                        spec,
                    )
                }
            }),
        )
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await?;
    eprintln!("Backend listening on http://localhost:3001");
    eprintln!("OpenAPI spec:     http://localhost:3001/openapi.json");
    axum::serve(listener, app).await?;
    Ok(())
}
