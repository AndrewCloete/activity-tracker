import type {
  ActivityDetail,
  ActivityStats,
  ActivitySummary,
  FieldValue,
  LogEntry,
  UpdateEntry,
} from "./schema";

// const BASE = "http://localhost:3001";
const BASE = "http://172.31.66.60:3001"; // via VPN

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

function json(body: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function del(path: string): Promise<void> {
  const r = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
}

export const api = {
  listActivities: () => req<ActivitySummary[]>("/activities"),

  createActivity: (name: string) =>
    req<ActivitySummary>("/activities", { method: "POST", ...json({ name }) }),

  getActivity: (id: number) => req<ActivityDetail>(`/activities/${id}`),

  createEntry: (id: number, values: FieldValue[], logged_at?: number, comment?: string) =>
    req<LogEntry>(`/activities/${id}/entries`, {
      method: "POST",
      ...json({ values, logged_at, comment }),
    }),

  updateEntry: (activityId: number, entryId: number, body: UpdateEntry) =>
    req<LogEntry>(`/activities/${activityId}/entries/${entryId}`, {
      method: "PUT",
      ...json(body),
    }),

  renameActivity: (id: number, name: string): Promise<void> =>
    fetch(`${BASE}/activities/${id}`, { method: "PATCH", ...json({ name }) }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    }),

  deleteActivity: (id: number) => del(`/activities/${id}`),

  deleteEntry: (activityId: number, entryId: number) =>
    del(`/activities/${activityId}/entries/${entryId}`),

  getStats: (id: number, period: "day" | "week" | "month") =>
    req<ActivityStats>(`/activities/${id}/stats?period=${period}`),
};
