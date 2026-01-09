'use client';

import { Box, Text } from '@chakra-ui/react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#d53f8c'];

export default function PieChart({ data, title, colors = DEFAULT_COLORS, height = 300 }: PieChartProps) {
  return (
    <Box>
      {title && (
        <Text fontSize="lg" fontWeight="600" color="white" mb={4}>
          {title}
        </Text>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </Box>
  );
}

