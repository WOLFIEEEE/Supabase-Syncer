'use client';

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartShell, useChartTokens } from './ChartShell';

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  colors?: string[];
  height?: number;
}

export default function PieChart({ data, title, colors, height = 300 }: PieChartProps) {
  const tokens = useChartTokens();
  const palette = colors && colors.length > 0 ? colors : tokens.palette;

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={80}
            fill={tokens.brand}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tokens.tooltipStyle} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
