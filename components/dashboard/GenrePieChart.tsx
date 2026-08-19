"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type PieLabelRenderProps,
} from "recharts";
import type { GenreSlice } from "@/lib/dashboard";
import {
  CHART_TOOLTIP_STYLE,
  getGenreShade,
} from "@/lib/chart-colors";
import { ChartCard } from "./ChartCard";

interface GenrePieChartProps {
  data: GenreSlice[];
}

function renderGenreLabel({ x, y, textAnchor, name, percent }: PieLabelRenderProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor === "inherit" ? "middle" : textAnchor}
      dominantBaseline="central"
      fill="var(--accent)"
      fontSize={12}
    >
      {`${name} ${Math.round((percent ?? 0) * 100)}%`}
    </text>
  );
}

export function GenrePieChart({ data }: GenrePieChartProps) {
  const isEmpty = data.length === 0;
  // Pie's own `name`/`count` data only — a `percent` field here would shadow
  // recharts' computed fraction in the label props (same key name).
  const pieData = data.map(({ name, count }) => ({ name, count }));

  return (
    <ChartCard title="By Genre" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 16, right: 8, bottom: 16, left: 8 }}>
          <Pie
            data={pieData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="42%"
            isAnimationActive={false}
            labelLine={{ stroke: "var(--border)" }}
            label={renderGenreLabel}
          >
            {data.map((slice, index) => (
              <Cell
                key={slice.name}
                fill={getGenreShade(index, data.length)}
                stroke="var(--card)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [`${value} games`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
