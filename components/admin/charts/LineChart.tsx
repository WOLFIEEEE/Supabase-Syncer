'use client';

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartShell, useChartTokens } from './ChartShell';

interface LineChartProps {
  data: Array<{ date: string; value: number; label?: string }>;
  title?: string;
  color?: string;
  height?: number;
}

export default function LineChart({ data, title, color, height = 300 }: LineChartProps) {
  const tokens = useChartTokens();
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.value,
    label: item.label,
  }));

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.grid} />
          <XAxis dataKey="date" stroke={tokens.axis} />
          <YAxis stroke={tokens.axis} />
          <Tooltip contentStyle={tokens.tooltipStyle} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color || tokens.brand}
            strokeWidth={2}
            dot={{ fill: color || tokens.brand, r: 4 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
