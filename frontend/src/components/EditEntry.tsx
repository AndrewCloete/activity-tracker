import { useEffect, useRef, useState } from "react";
import type { FieldValue, LogEntry, UpdateEntry } from "../api/types";
import { fromLocalDatetimeString, toLocalDatetimeString } from "../utils";

interface Props {
  entry: LogEntry;
  activityName: string;
  onSave: (body: UpdateEntry) => Promise<void>;
  onCancel: () => void;
}

interface DynField {
  label: string;
  value: string;
}

export default function EditEntry({ entry, activityName, onSave, onCancel }: Props) {
  const firstRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(activityName);
  const [loggedAt, setLoggedAt] = useState(() => toLocalDatetimeString(entry.logged_at));
  const [values, setValues] = useState<FieldValue[]>(entry.values.map((v) => ({ ...v })));
  const [extra, setExtra] = useState<DynField[]>([]);
  const [comment, setComment] = useState(entry.comment ?? "");

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const extraValues = extra
      .filter((f) => f.label.trim() && f.value !== "")
      .map((f) => ({ label: f.label.trim(), value: parseFloat(f.value) || 0 }));
    await onSave({
      values: [...values, ...extraValues],
      logged_at: fromLocalDatetimeString(loggedAt),
      activity_name: name !== activityName ? name : undefined,
      comment: comment || undefined,
    });
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.4rem 0.6rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    width: "100%",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ border: "1px solid #6366f1", borderRadius: 6, padding: "1rem", background: "#fff" }}
    >
      <h3 style={{ margin: "0 0 0.75rem" }}>Edit entry</h3>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
          Activity name
          <span style={{ color: "#888", marginLeft: "0.4rem", fontWeight: 400 }}>
            (renaming affects all entries)
          </span>
        </label>
        <input
          ref={firstRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>When</label>
        <input
          type="datetime-local"
          value={loggedAt}
          onChange={(e) => setLoggedAt(e.target.value)}
          style={inputStyle}
        />
      </div>

      {values.map((v, i) => (
        <div key={i} style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
            {v.label}
          </label>
          <input
            type="number"
            step="any"
            value={v.value}
            onChange={(e) => {
              const next = [...values];
              next[i] = { ...next[i], value: parseFloat(e.target.value) || 0 };
              setValues(next);
            }}
            style={inputStyle}
          />
        </div>
      ))}

      {extra.map((field, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            placeholder="label (e.g. belt)"
            value={field.label}
            onChange={(e) => {
              const next = [...extra];
              next[i] = { ...next[i], label: e.target.value };
              setExtra(next);
            }}
            style={{ ...inputStyle, width: "auto", flex: 1 }}
          />
          <input
            type="number"
            step="any"
            placeholder="value"
            value={field.value}
            onChange={(e) => {
              const next = [...extra];
              next[i] = { ...next[i], value: e.target.value };
              setExtra(next);
            }}
            style={{ ...inputStyle, width: 100 }}
          />
          <button
            type="button"
            onClick={() => setExtra(extra.filter((_, j) => j !== i))}
            style={{ padding: "0 0.5rem" }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setExtra([...extra, { label: "", value: "" }])}
        style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}
      >
        + add field
      </button>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional notes…"
          rows={2}
          style={{ padding: "0.4rem 0.6rem", border: "1px solid #ccc", borderRadius: 4, width: "100%", resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
