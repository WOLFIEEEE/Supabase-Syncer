'use client';

import {
  Box, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td, Card, CardBody, Badge, Text, useToast, Spinner, SimpleGrid, Select, Button,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import MetricCard from '@/components/admin/charts/MetricCard';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  user_id?: string;
  ip_address?: string;
  created_at: string;
}

export default function SecurityMonitoringClient({ adminUser }: { adminUser: { id: string; email: string } }) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const toast = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: limit.toString(), offset: '0' });
      if (severityFilter) params.append('severity', severityFilter);
      const response = await fetch(`/api/admin/security-events?${params}`);
      const result = await response.json();
      if (result.success) {
        setEvents(result.data);
        setTotal(result.pagination.total);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch events', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [severityFilter, limit]);

  const severityColors: Record<string, string> = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' };
  const stats = {
    critical: events.filter(e => e.severity === 'critical').length,
    high: events.filter(e => e.severity === 'high').length,
    medium: events.filter(e => e.severity === 'medium').length,
    low: events.filter(e => e.severity === 'low').length,
  };

  return (
    <VStack spacing={6} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <MetricCard title="Critical" value={stats.critical} color="red" />
        <MetricCard title="High" value={stats.high} color="orange" />
        <MetricCard title="Medium" value={stats.medium} color="yellow" />
        <MetricCard title="Low" value={stats.low} color="blue" />
      </SimpleGrid>

      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody>
          <HStack spacing={4}>
            <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} bg="surface.900" borderColor="surface.700" color="white" w="200px" placeholder="All Severities">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <Button onClick={() => fetch('/api/admin/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'security-events', format: 'csv' }) }).then(r => r.blob()).then(b => { const u = window.URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'security-events.csv'; a.click(); })}>Export CSV</Button>
          </HStack>
        </CardBody>
      </Card>

      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody p={0}>
          {loading ? <Box p={8} textAlign="center"><Spinner size="xl" color="brand.400" /></Box> : (
            <Table variant="simple" colorScheme="whiteAlpha">
              <Thead><Tr><Th color="surface.300">Event Type</Th><Th color="surface.300">Severity</Th><Th color="surface.300">IP Address</Th><Th color="surface.300">Time</Th></Tr></Thead>
              <Tbody>
                {events.map((e) => (
                  <Tr key={e.id}>
                    <Td color="white">{e.event_type}</Td>
                    <Td><Badge colorScheme={severityColors[e.severity] || 'gray'}>{e.severity}</Badge></Td>
                    <Td color="surface.400" fontFamily="mono" fontSize="sm">{e.ip_address || '-'}</Td>
                    <Td color="surface.400" fontSize="sm">{new Date(e.created_at).toLocaleString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}

