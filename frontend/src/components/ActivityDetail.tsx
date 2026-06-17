import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { api } from "../api";
import type { ActivityDetail as Detail, ActivityStats, LogEntry } from "../api/types";
import AddEntry from "./AddEntry";
import EditEntry from "./EditEntry";
import StatsChart from "./StatsChart";

type Period = "week" | "month" | "year";

interface Props {
  id: number;
  onBack: () => void;
}

export default function ActivityDetail({ id, onBack }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [addingEntry, setAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const reload = useCallback(() => {
    api.getActivity(id).then(setDetail);
  }, [id]);

  const reloadStats = useCallback(() => {
    api.getStats(id, period).then(setStats);
  }, [id, period]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { reloadStats(); }, [reloadStats]);
  useEffect(() => { if (detail) setNameInput(detail.name); }, [detail?.name]);

  if (!detail) return <div style={{ padding: "1rem", color: "#888" }}>Loading…</div>;

  const columns =
    detail.field_schema.length > 0
      ? detail.field_schema.map((f) => f.label)
      : detail.last_entries[0]?.values.map((v) => v.label) ?? [];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <button onClick={onBack}>← Back</button>
        {editingName ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const name = nameInput.trim();
              if (name && name !== detail.name) await api.renameActivity(id, name);
              setEditingName(false);
              reload();
            }}
            style={{ display: "flex", gap: "0.5rem", flex: 1, alignItems: "center" }}
          >
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{ flex: 1, padding: "0.3rem 0.6rem", border: "1px solid #ccc", borderRadius: 4, fontSize: "1.25rem", fontWeight: "bold" }}
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => { setEditingName(false); setNameInput(detail.name); }}>
              Cancel
            </button>
          </form>
        ) : (
          <>
            <h1 style={{ margin: 0, flex: 1 }}>{detail.name}</h1>
            <button onClick={() => setEditingName(true)} style={{ fontSize: "0.85rem" }}>
              Rename
            </button>
          </>
        )}
        <button
          onClick={async () => {
            if (!window.confirm(`Delete "${detail.name}" and all its entries?`)) return;
            await api.deleteActivity(id);
            onBack();
          }}
          style={{ color: "#c00", fontSize: "0.85rem" }}
        >
          Delete activity
        </button>
      </div>

      <h2 style={{ marginBottom: "0.5rem" }}>Recent entries</h2>

      {detail.last_entries.length === 0 ? (
        <p style={{ color: "#888" }}>No entries yet.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
            background: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem 0.75rem" }}>When</th>
              {columns.map((col) => (
                <th key={col} style={{ textAlign: "right", padding: "0.5rem 0.75rem" }}>
                  {col}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {detail.last_entries.map((entry) => (
              <tr key={entry.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.5rem 0.75rem", color: "#888" }}>
                  <div style={{ whiteSpace: "nowrap" }}>
                    {formatDistanceToNow(new Date(entry.logged_at * 1000), { addSuffix: true })}
                  </div>
                  {entry.comment && (
                    <div style={{ fontStyle: "italic", fontSize: "0.8rem", color: "#666", marginTop: 2 }}>
                      {entry.comment}
                    </div>
                  )}
                </td>
                {columns.map((col) => {
                  const v = entry.values.find((x) => x.label === col);
                  return (
                    <td key={col} style={{ textAlign: "right", padding: "0.5rem 0.75rem" }}>
                      {v?.value ?? "—"}
                    </td>
                  );
                })}
                <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => {
                      setAddingEntry(false);
                      setEditingEntry(entry);
                    }}
                    style={{ fontSize: "0.8rem", marginRight: "0.4rem" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm("Delete this entry?")) return;
                      await api.deleteEntry(id, entry.id);
                      reload();
                      reloadStats();
                      if (editingEntry?.id === entry.id) setEditingEntry(null);
                    }}
                    style={{ fontSize: "0.8rem", color: "#c00" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: "1rem" }}>
        {editingEntry ? (
          <EditEntry
            entry={editingEntry}
            activityName={detail.name}
            onSave={async (body) => {
              await api.updateEntry(id, editingEntry.id, body);
              reload();
              reloadStats();
              setEditingEntry(null);
            }}
            onCancel={() => setEditingEntry(null)}
          />
        ) : addingEntry ? (
          <AddEntry
            fieldSchema={detail.field_schema}
            onSubmit={async (values, logged_at, comment) => {
              await api.createEntry(id, values, logged_at, comment);
              reload();
              reloadStats();
              setAddingEntry(false);
            }}
            onCancel={() => setAddingEntry(false)}
          />
        ) : (
          <button onClick={() => setAddingEntry(true)}>+ Log entry</button>
        )}
      </div>

      <h2 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>Stats</h2>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["week", "month", "year"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              fontWeight: period === p ? 700 : 400,
              textDecoration: period === p ? "underline" : "none",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {stats && <StatsChart stats={stats} />}
    </>
  );
}
