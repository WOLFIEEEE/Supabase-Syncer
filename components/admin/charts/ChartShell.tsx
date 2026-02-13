'use client';

import { Box, Text, useToken } from '@chakra-ui/react';

interface ChartShellProps {
  title?: string;
  children: React.ReactNode;
}

export function ChartShell({ title, children }: ChartShellProps) {
  return (
    <Box>
      {title && (
        <Text fontSize="lg" fontWeight="600" color="text.primary" mb={4}>
          {title}
        </Text>
      )}
      {children}
    </Box>
  );
}

export function useChartTokens() {
  const [grid, axis, tooltipBg, tooltipBorder, tooltipText, brand, accent, success, warning, error, violet] = useToken('colors', [
    'border.default',
    'text.tertiary',
    'bg.elevated',
    'border.strong',
    'text.primary',
    'brand.400',
    'accent.400',
    'success.400',
    'warning.400',
    'error.400',
    'purple.400',
  ]);

  return {
    grid,
    axis,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    brand,
    accent,
    success,
    warning,
    error,
    palette: [brand, success, warning, error, accent, violet],
    tooltipStyle: {
      backgroundColor: tooltipBg,
      border: `1px solid ${tooltipBorder}`,
      borderRadius: '10px',
      color: tooltipText,
    },
  };
}
