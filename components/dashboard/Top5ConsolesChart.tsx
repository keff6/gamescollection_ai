"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ConsoleBar } from "@/lib/dashboard";
import {
  CHART_ACCENT,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_STYLE,
} from "@/lib/chart-colors";
import { ChartCard } from "./ChartCard";

interface Top5ConsolesChartProps {
  data: ConsoleBar[];
}

export function Top5ConsolesChart({ data }: Top5ConsolesChartProps) {
  const isEmpty = data.length === 0;

  return (
    <ChartCard title="Top 5 Consoles by Games" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={CHART_TICK_STYLE}
            stroke="var(--border)"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={CHART_TICK_STYLE}
            stroke="var(--border)"
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${value} games`, "Games"]}
          />
          <Bar dataKey="count" fill={CHART_ACCENT} radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="count"
              position="right"
              fill="var(--foreground)"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
