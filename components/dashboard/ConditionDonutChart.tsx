"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ConditionSlice } from "@/lib/dashboard";
import { CHART_TOOLTIP_STYLE, CONDITION_COLORS } from "@/lib/chart-colors";
import { ChartCard } from "./ChartCard";

interface ConditionDonutChartProps {
  data: ConditionSlice[];
}

export function ConditionDonutChart({ data }: ConditionDonutChartProps) {
  const isEmpty = data.length === 0;
  const dominant = data.reduce<ConditionSlice | null>(
    (max, slice) => (!max || slice.percent > max.percent ? slice : max),
    null,
  );

  return (
    <ChartCard title="Games Condition" isEmpty={isEmpty}>
      <div className="flex h-full items-center gap-6">
        <div className="relative h-full min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="90%"
                paddingAngle={data.length > 1 ? 3 : 0}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((slice) => (
                  <Cell
                    key={slice.label}
                    fill={CONDITION_COLORS[slice.label]}
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
          {dominant && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">
                {dominant.percent}%
              </span>
            </div>
          )}
        </div>
        <ul className="flex shrink-0 flex-col gap-2">
          {data.map((slice) => (
            <li
              key={slice.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: CONDITION_COLORS[slice.label] }}
                aria-hidden="true"
              />
              {slice.label.toLowerCase()}
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
