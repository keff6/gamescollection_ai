"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlatformBar } from "@/lib/dashboard";
import {
  CHART_ACCENT,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_STYLE,
} from "@/lib/chart-colors";
import { ChartCard } from "./ChartCard";

interface PlatformBarChartProps {
  data: PlatformBar[];
}

export function PlatformBarChart({ data }: PlatformBarChartProps) {
  const isEmpty = data.length === 0;

  return (
    <ChartCard title="By Platform" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="shortName"
            angle={-40}
            textAnchor="end"
            height={60}
            interval={0}
            tick={CHART_TICK_STYLE}
            stroke="var(--border)"
          />
          <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} stroke="var(--border)" />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${value} games`, "Games"]}
          />
          <Bar dataKey="count" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
