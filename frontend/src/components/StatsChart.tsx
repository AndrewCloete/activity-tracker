import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityStats } from "../api/schema";

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Props {
  stats: ActivityStats;
}

export default function StatsChart({ stats }: Props) {
  const bottomMargin = 56;

  return (
    <div>
      <h3 style={{ marginBottom: "0.5rem" }}>Entry count</h3>
      <ResponsiveContainer width="100%" height={180 + bottomMargin}>
        <BarChart data={stats.counts} margin={{ top: 4, right: 8, left: -16, bottom: bottomMargin }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={bottomMargin}
          />
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
          <ResponsiveContainer width="100%" height={180 + bottomMargin}>
            <BarChart data={field.data} margin={{ top: 4, right: 8, left: -16, bottom: bottomMargin }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={bottomMargin}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sum" fill={PALETTE[fi % PALETTE.length]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="avg" fill={PALETTE[(fi + 1) % PALETTE.length]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
