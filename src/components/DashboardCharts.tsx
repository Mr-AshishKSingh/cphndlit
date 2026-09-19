"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Validated categorical palette (fixed order — see dataviz skill, palette.md).
// Assigned by entity in stable order, never cycled/re-ranked on filter.
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

// Fixed status tokens — reserved for fields that are genuinely a status, never
// reused as a generic series color.
const STATUS = { good: "#0ca30c", info: "#2a78d6", muted: "#898781", critical: "#d03b3b" };

const GRID_STROKE = "#e5e7eb";
const AXIS_TICK = { fontSize: 12, fill: "#64748b" };

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 16px -4px rgba(15,23,42,0.12)",
  fontSize: 13,
  padding: "8px 12px",
};

function CenterTotal({ total, label }: { total: number; label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-2xl font-semibold text-slate-900 tracking-tight">{total}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

export function AttendanceTrendChart({ data }: { data: { day: string; present: number; absent: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="0" vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#475569" }}
          formatter={(value) => <span className="text-slate-600">{value}</span>}
        />
        <Bar dataKey="present" name="Present" fill={STATUS.info} radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Bar dataKey="absent" name="Absent" fill={STATUS.muted} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DepartmentPieChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <p className="text-sm text-slate-500 py-16 text-center">No employees yet.</p>;
  }
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "#475569" }}
            formatter={(value) => <span className="text-slate-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <CenterTotal total={total} label="Employees" />
    </div>
  );
}

const TASK_STATUS_COLOR: Record<string, string> = {
  Todo: STATUS.muted,
  "In Progress": STATUS.info,
  Done: STATUS.good,
  Blocked: STATUS.critical,
};

export function TaskStatusChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <p className="text-sm text-slate-500 py-16 text-center">No tasks yet.</p>;
  }
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={TASK_STATUS_COLOR[d.name] ?? CATEGORICAL[i % CATEGORICAL.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "#475569" }}
            formatter={(value) => <span className="text-slate-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <CenterTotal total={total} label="Tasks" />
    </div>
  );
}
