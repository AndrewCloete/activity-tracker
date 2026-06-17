import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { api } from "../api";
import type { ActivitySummary } from "../api/types";

interface Props {
  onSelect: (id: number) => void;
}

export default function ActivityList({ onSelect }: Props) {
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.listActivities().then(setActivities);
  }, []);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const a = await api.createActivity(name);
    setActivities((prev) => [a, ...prev]);
    setNewName("");
    setCreating(false);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Activities</h1>
        <button onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "New activity"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
        >
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Activity name"
            style={{ flex: 1, padding: "0.4rem 0.6rem", border: "1px solid #ccc", borderRadius: 4 }}
          />
          <button type="submit">Create</button>
        </form>
      )}

      {activities.length === 0 && !creating && (
        <p style={{ color: "#888" }}>No activities yet. Create one to get started.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {activities.map((a) => (
          <li
            key={a.id}
            onClick={() => onSelect(a.id)}
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "0.5rem",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
              cursor: "pointer",
              background: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{a.name}</strong>
              <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 2 }}>
                {a.entry_count} {a.entry_count === 1 ? "entry" : "entries"}
                {a.last_logged_at && (
                  <>
                    {" · last "}
                    {formatDistanceToNow(new Date(a.last_logged_at * 1000), { addSuffix: true })}
                  </>
                )}
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!window.confirm(`Delete "${a.name}" and all its entries?`)) return;
                await api.deleteActivity(a.id);
                setActivities((prev) => prev.filter((x) => x.id !== a.id));
              }}
              style={{ fontSize: "0.8rem", color: "#c00" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
