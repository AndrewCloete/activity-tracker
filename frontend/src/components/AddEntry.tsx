import { useEffect, useRef, useState } from "react";
import type { FieldSchema, FieldValue } from "../api/types";
import { fromLocalDatetimeString, nowLocalDatetimeString } from "../utils";

interface Props {
  fieldSchema: FieldSchema[];
  onSubmit: (values: FieldValue[], logged_at: number, comment?: string) => void;
  onCancel: () => void;
}

interface DynField {
  label: string;
  value: string;
}

export default function AddEntry({ fieldSchema, onSubmit, onCancel }: Props) {
  const firstRef = useRef<HTMLInputElement>(null);

  const [fixed, setFixed] = useState<Record<string, string>>(
    Object.fromEntries(fieldSchema.map((f) => [f.label, ""]))
  );
  // Always present: new fields the user adds on top of the schema
  const [extra, setExtra] = useState<DynField[]>(
    fieldSchema.length === 0 ? [{ label: "", value: "" }] : []
  );
  const [loggedAt, setLoggedAt] = useState(nowLocalDatetimeString);
  const [comment, setComment] = useState("");

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const schemaValues = fieldSchema.map((f) => ({
      label: f.label,
      value: parseFloat(fixed[f.label]) || 0,
    }));
    const extraValues = extra
      .filter((f) => f.label.trim() && f.value !== "")
      .map((f) => ({ label: f.label.trim(), value: parseFloat(f.value) || 0 }));
    onSubmit([...schemaValues, ...extraValues], fromLocalDatetimeString(loggedAt), comment || undefined);
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
      style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: "1rem", background: "#fff" }}
    >
      <h3 style={{ margin: "0 0 0.75rem" }}>New entry</h3>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>When</label>
        <input
          type="datetime-local"
          value={loggedAt}
          onChange={(e) => setLoggedAt(e.target.value)}
          style={inputStyle}
        />
      </div>

      {fieldSchema.map((f, i) => (
        <div key={f.label} style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
            {f.label}
            <span style={{ color: "#888", marginLeft: "0.4rem" }}>prev: {f.last_value}</span>
          </label>
          <input
            ref={i === 0 ? firstRef : undefined}
            type="number"
            step="any"
            value={fixed[f.label]}
            onChange={(e) => setFixed((p) => ({ ...p, [f.label]: e.target.value }))}
            placeholder={String(f.last_value)}
            style={inputStyle}
          />
        </div>
      ))}

      {extra.map((field, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            ref={fieldSchema.length === 0 && i === 0 ? firstRef : undefined}
            placeholder="label (e.g. reps)"
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
          {(extra.length > 1 || fieldSchema.length > 0) && (
            <button
              type="button"
              onClick={() => setExtra(extra.filter((_, j) => j !== i))}
              style={{ padding: "0 0.5rem" }}
            >
              ×
            </button>
          )}
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
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
