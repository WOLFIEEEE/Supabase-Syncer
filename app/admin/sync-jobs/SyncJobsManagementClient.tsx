'use client';

import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  Badge,
  Text,
  useToast,
  Spinner,
  Select,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  SimpleGrid,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import MetricCard from '@/components/admin/charts/MetricCard';

interface SyncJob {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface SyncJobsManagementClientProps {
  adminUser: { id: string; email: string };
}

export default function SyncJobsManagementClient({ adminUser }: SyncJobsManagementClientProps) {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const toast = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/sync-jobs?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setJobs(result.data);
        setTotal(result.pagination.total);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch sync jobs', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [offset, limit, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(new Set(jobs.map(j => j.id)));
    } else {
      setSelectedJobs(new Set());
    }
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    const newSelected = new Set(selectedJobs);
    if (checked) {
      newSelected.add(jobId);
    } else {
      newSelected.delete(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.size === 0) return;
    
    toast({ title: 'Processing', description: `Performing ${action} on ${selectedJobs.size} jobs...`, status: 'info' });
    // Implement bulk actions
    setSelectedJobs(new Set());
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sync-jobs', format: 'csv', filters: { status: statusFilter } }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sync-jobs-export-${new Date().toISOString()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Success', description: 'Sync jobs exported', status: 'success' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Export failed', status: 'error' });
    }
  };

  const statusColors: Record<string, string> = {
    completed: 'green',
    running: 'blue',
    failed: 'red',
    pending: 'yellow',
    paused: 'orange',
  };

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    running: jobs.filter(j => j.status === 'running').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <VStack spacing={6} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <MetricCard title="Total Jobs" value={stats.total} color="blue" />
        <MetricCard title="Completed" value={stats.completed} color="green" />
        <MetricCard title="Running" value={stats.running} color="blue" />
        <MetricCard title="Failed" value={stats.failed} color="red" />
      </SimpleGrid>

      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody>
          <HStack spacing={4}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              bg="surface.900"
              borderColor="surface.700"
              color="white"
              w="200px"
              placeholder="All Statuses"
            >
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="paused">Paused</option>
            </Select>
            <Select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              bg="surface.900"
              borderColor="surface.700"
              color="white"
              w="200px"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </Select>
            {selectedJobs.size > 0 && (
              <Menu>
                <MenuButton as={Button} colorScheme="brand">
                  Bulk Actions ({selectedJobs.size})
                </MenuButton>
                <MenuList bg="surface.800" borderColor="surface.700">
                  <MenuItem onClick={() => handleBulkAction('pause')} bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
                    Pause Selected
                  </MenuItem>
                  <MenuItem onClick={() => handleBulkAction('resume')} bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
                    Resume Selected
                  </MenuItem>
                  <MenuItem onClick={() => handleBulkAction('cancel')} bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
                    Cancel Selected
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
            <Button colorScheme="brand" onClick={handleExport}>
              Export CSV
            </Button>
          </HStack>
        </CardBody>
      </Card>

      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody p={0}>
          {loading ? (
            <Box p={8} textAlign="center">
              <Spinner size="xl" color="brand.400" />
            </Box>
          ) : (
            <Table variant="simple" colorScheme="whiteAlpha">
              <Thead>
                <Tr>
                  <Th>
                    <Checkbox
                      isChecked={selectedJobs.size === jobs.length && jobs.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </Th>
                  <Th color="surface.300">Job ID</Th>
                  <Th color="surface.300">User ID</Th>
                  <Th color="surface.300">Status</Th>
                  <Th color="surface.300">Created</Th>
                  <Th color="surface.300">Started</Th>
                  <Th color="surface.300">Completed</Th>
                </Tr>
              </Thead>
              <Tbody>
                {jobs.map((job) => (
                  <Tr key={job.id}>
                    <Td>
                      <Checkbox
                        isChecked={selectedJobs.has(job.id)}
                        onChange={(e) => handleSelectJob(job.id, e.target.checked)}
                      />
                    </Td>
                    <Td color="white" fontFamily="mono" fontSize="sm">
                      {job.id.substring(0, 8)}...
                    </Td>
                    <Td color="surface.400" fontFamily="mono" fontSize="sm">
                      {job.user_id.substring(0, 8)}...
                    </Td>
                    <Td>
                      <Badge colorScheme={statusColors[job.status] || 'gray'}>
                        {job.status}
                      </Badge>
                    </Td>
                    <Td color="surface.400" fontSize="sm">
                      {new Date(job.created_at).toLocaleString()}
                    </Td>
                    <Td color="surface.400" fontSize="sm">
                      {job.started_at ? new Date(job.started_at).toLocaleString() : '-'}
                    </Td>
                    <Td color="surface.400" fontSize="sm">
                      {job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {!loading && total > 0 && (
        <HStack justify="space-between">
          <Text color="surface.400" fontSize="sm">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} jobs
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              isDisabled={offset === 0}
              variant="outline"
              borderColor="surface.700"
              color="white"
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => setOffset(offset + limit)}
              isDisabled={offset + limit >= total}
              variant="outline"
              borderColor="surface.700"
              color="white"
            >
              Next
            </Button>
          </HStack>
        </HStack>
      )}
    </VStack>
  );
}

