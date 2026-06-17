import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityStats } from "../api/types";

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Props {
  stats: ActivityStats;
}

export default function StatsChart({ stats }: Props) {
  if (stats.counts.length === 0) {
    return <p style={{ color: "#888" }}>No data for this period.</p>;
  }

  return (
    <div>
      <h3 style={{ marginBottom: "0.5rem" }}>Entry count</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={stats.counts} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill={PALETTE[0]} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {stats.field_stats.map((field, fi) => (
        <div key={field.label} style={{ marginTop: "1.5rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>
            {field.label} — sum &amp; avg
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={field.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="sum"
                stroke={PALETTE[fi % PALETTE.length]}
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke={PALETTE[(fi + 1) % PALETTE.length]}
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
