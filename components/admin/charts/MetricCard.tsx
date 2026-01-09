'use client';

import { Card, CardBody, Text, Heading, HStack, Box, Badge } from '@chakra-ui/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'gray' | 'green' | 'red' | 'blue' | 'yellow' | 'orange';
  subtitle?: string;
}

export default function MetricCard({ title, value, trend, color = 'gray', subtitle }: MetricCardProps) {
  const colors = {
    gray: { text: 'white', border: 'surface.700' },
    green: { text: 'green.400', border: 'green.500/30' },
    red: { text: 'red.400', border: 'red.500/30' },
    blue: { text: 'blue.400', border: 'blue.500/30' },
    yellow: { text: 'yellow.400', border: 'yellow.500/30' },
    orange: { text: 'orange.400', border: 'orange.500/30' },
  };

  const colorConfig = colors[color];

  return (
    <Card bg="surface.800" borderColor={colorConfig.border} borderWidth="1px" _hover={{ borderColor: 'brand.400/40' }} transition="all 0.2s">
      <CardBody>
        <Text fontSize="sm" color="surface.400" mb={2}>
          {title}
        </Text>
        <HStack spacing={2} align="baseline">
          <Heading as="h3" size="lg" color={colorConfig.text}>
            {value}
          </Heading>
          {trend && (
            <Badge
              colorScheme={trend.isPositive ? 'green' : 'red'}
              fontSize="xs"
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
            </Badge>
          )}
        </HStack>
        {subtitle && (
          <Text fontSize="xs" color="surface.500" mt={2}>
            {subtitle}
          </Text>
        )}
      </CardBody>
    </Card>
  );
}

