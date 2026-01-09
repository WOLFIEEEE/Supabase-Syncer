'use client';

import { VStack, Card, CardBody, HStack, Box, Text, SimpleGrid } from '@chakra-ui/react';
import MetricCard from '@/components/admin/charts/MetricCard';

export default function SystemHealthClient({ adminUser, systemStatus }: { adminUser: { id: string; email: string }; systemStatus: any }) {
  const statusColors: Record<string, 'green' | 'yellow' | 'red'> = {
    operational: 'green',
    degraded: 'yellow',
    down: 'red',
  };

  return (
    <VStack spacing={6} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <MetricCard title="API Status" value={systemStatus.api} color={statusColors[systemStatus.api] || 'gray'} />
        <MetricCard title="Database Status" value={systemStatus.database} color={statusColors[systemStatus.database] || 'gray'} />
        <MetricCard title="Queue Status" value={systemStatus.queue} color={statusColors[systemStatus.queue] || 'gray'} />
        <MetricCard title="Cache Status" value={systemStatus.cache} color={statusColors[systemStatus.cache] || 'gray'} />
      </SimpleGrid>
    </VStack>
  );
}

