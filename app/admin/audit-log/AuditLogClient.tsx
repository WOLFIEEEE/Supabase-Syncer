'use client';

import { Box, VStack, Table, Thead, Tbody, Tr, Th, Td, Card, CardBody, Text, useToast, Spinner, Select, Button, HStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

export default function AuditLogClient({ adminUser }: { adminUser: { id: string; email: string } }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetch('/api/admin/security-events?limit=100')
      .then(r => r.json())
      .then(d => { if (d.success) setEvents(d.data); })
      .catch(() => toast({ title: 'Error', description: 'Failed to fetch audit log', status: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <VStack spacing={6} align="stretch">
      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody p={0}>
          {loading ? <Box p={8} textAlign="center"><Spinner size="xl" color="brand.400" /></Box> : (
            <Table variant="simple" colorScheme="whiteAlpha">
              <Thead><Tr><Th color="surface.300">Event</Th><Th color="surface.300">User</Th><Th color="surface.300">IP</Th><Th color="surface.300">Time</Th></Tr></Thead>
              <Tbody>
                {events.map((e) => (
                  <Tr key={e.id}>
                    <Td color="white">{e.event_type}</Td>
                    <Td color="surface.400" fontFamily="mono" fontSize="sm">{e.user_id ? e.user_id.substring(0, 8) + '...' : '-'}</Td>
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

