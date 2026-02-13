'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartShell, useChartTokens } from './ChartShell';

interface BarChartProps {
  data: Array<{ date: string; value: number; label?: string }>;
  title?: string;
  color?: string;
  height?: number;
}

export default function BarChart({ data, title, color, height = 300 }: BarChartProps) {
  const tokens = useChartTokens();
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.value,
    label: item.label,
  }));

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.grid} />
          <XAxis dataKey="date" stroke={tokens.axis} />
          <YAxis stroke={tokens.axis} />
          <Tooltip contentStyle={tokens.tooltipStyle} />
          <Bar dataKey="value" fill={color || tokens.brand} radius={[8, 8, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
