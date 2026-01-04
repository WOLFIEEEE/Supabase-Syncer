'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  useToast,
  IconButton,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion.div;

// Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

interface SyncJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  direction: 'one_way' | 'two_way';
  createdAt: string;
  completedAt?: string;
  sourceConnection?: { name: string; environment: string };
  targetConnection?: { name: string; environment: string };
  progress?: {
    totalTables: number;
    completedTables: number;
    processedRows: number;
  };
  error?: string;
}

const statusColors: Record<string, string> = {
  pending: 'yellow',
  running: 'blue',
  completed: 'green',
  failed: 'red',
  paused: 'orange',
};

export default function SyncHistoryPage() {
  const router = useRouter();
  const toast = useToast();
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const fetchSyncJobs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      if (data.success) {
        setSyncJobs(data.data);
      }
    } catch (error) {
      toast({
        title: 'Failed to load sync history',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncJobs();
  }, []);

  const filteredJobs = syncJobs.filter((job) => {
    const matchesFilter = filter === 'all' || job.status === filter;
    const matchesSearch = search === '' || 
      job.name?.toLowerCase().includes(search.toLowerCase()) ||
      job.sourceConnection?.name.toLowerCase().includes(search.toLowerCase()) ||
      job.targetConnection?.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDuration = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  return (
    <Box minH="100vh" className="gradient-mesh">
      {/* Header */}
      <Box as="header" bg="surface.800" borderBottomWidth="1px" borderColor="surface.700">
        <Container maxW="7xl" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <IconButton
                aria-label="Back"
                icon={<ArrowLeftIcon />}
                variant="ghost"
                onClick={() => router.push('/')}
              />
              <Heading size="md" color="white">Sync History</Heading>
            </HStack>
            <HStack spacing={2}>
              <IconButton
                aria-label="Refresh"
                icon={<RefreshIcon />}
                variant="ghost"
                onClick={fetchSyncJobs}
                isLoading={isLoading}
              />
              <Button
                colorScheme="teal"
                size="sm"
                onClick={() => router.push('/sync/create')}
              >
                New Sync
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" py={8}>
        {/* Filters */}
        <Card bg="surface.800" borderColor="surface.700" mb={6}>
          <CardBody>
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none" color="surface.400">
                  <SearchIcon />
                </InputLeftElement>
                <Input
                  placeholder="Search by name or connection..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  bg="surface.900"
                  borderColor="surface.600"
                />
              </InputGroup>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                w={{ base: '100%', md: '200px' }}
                bg="surface.900"
                borderColor="surface.600"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="paused">Paused</option>
              </Select>
            </Flex>
          </CardBody>
        </Card>

        {/* Results */}
        {isLoading ? (
          <Flex justify="center" py={16}>
            <Spinner size="xl" color="brand.400" />
          </Flex>
        ) : filteredJobs.length === 0 ? (
          <Card bg="surface.800" borderColor="surface.700">
            <CardBody>
              <VStack spacing={4} py={12}>
                <Box color="surface.500">
                  <ClockIcon />
                </Box>
                <Text color="surface.400">
                  {syncJobs.length === 0 
                    ? 'No sync jobs yet' 
                    : 'No jobs match your filters'}
                </Text>
                {syncJobs.length === 0 && (
                  <Button
                    colorScheme="teal"
                    onClick={() => router.push('/sync/create')}
                  >
                    Create your first sync
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={3} align="stretch">
            {/* Desktop Table View */}
            <Box display={{ base: 'none', lg: 'block' }} overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th color="surface.400" borderColor="surface.700">Status</Th>
                    <Th color="surface.400" borderColor="surface.700">
                      <HStack spacing={1}>
                        <Text>Source</Text>
                        <ArrowRightIcon />
                        <Text>Target</Text>
                      </HStack>
                    </Th>
                    <Th color="surface.400" borderColor="surface.700">Progress</Th>
                    <Th color="surface.400" borderColor="surface.700">Duration</Th>
                    <Th color="surface.400" borderColor="surface.700">Date</Th>
                    <Th color="surface.400" borderColor="surface.700">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredJobs.map((job) => (
                    <Tr 
                      key={job.id} 
                      _hover={{ bg: 'surface.700' }} 
                      cursor="pointer"
                      onClick={() => router.push(`/sync/${job.id}`)}
                    >
                      <Td borderColor="surface.700">
                        <Badge colorScheme={statusColors[job.status]}>
                          {job.status.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td borderColor="surface.700">
                        <VStack align="start" spacing={0}>
                          <Text color="white" fontSize="sm">
                            {job.sourceConnection?.name || 'Unknown'}
                          </Text>
                          <HStack color="surface.500" fontSize="xs" spacing={1}>
                            <ArrowRightIcon />
                            <Text>{job.targetConnection?.name || 'Unknown'}</Text>
                          </HStack>
                        </VStack>
                      </Td>
                      <Td borderColor="surface.700">
                        {job.progress ? (
                          <Text color="surface.300" fontSize="sm">
                            {job.progress.completedTables}/{job.progress.totalTables} tables
                            <Text as="span" color="surface.500" fontSize="xs" ml={1}>
                              ({job.progress.processedRows.toLocaleString()} rows)
                            </Text>
                          </Text>
                        ) : (
                          <Text color="surface.500" fontSize="sm">-</Text>
                        )}
                      </Td>
                      <Td borderColor="surface.700">
                        <Text color="surface.300" fontSize="sm">
                          {formatDuration(job.createdAt, job.completedAt)}
                        </Text>
                      </Td>
                      <Td borderColor="surface.700">
                        <Text color="surface.400" fontSize="sm">
                          {new Date(job.createdAt).toLocaleString()}
                        </Text>
                      </Td>
                      <Td borderColor="surface.700">
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="teal"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/sync/${job.id}`);
                          }}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {/* Mobile Card View */}
            <VStack spacing={3} display={{ base: 'flex', lg: 'none' }}>
              {filteredJobs.map((job, index) => (
                <MotionCard
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  style={{ width: '100%' }}
                >
                  <Card 
                    bg="surface.800" 
                    borderColor="surface.700"
                    cursor="pointer"
                    onClick={() => router.push(`/sync/${job.id}`)}
                    _hover={{ borderColor: 'brand.500' }}
                  >
                    <CardBody p={4}>
                      <VStack spacing={3} align="stretch">
                        <Flex justify="space-between" align="start">
                          <Badge colorScheme={statusColors[job.status]}>
                            {job.status.toUpperCase()}
                          </Badge>
                          <Text color="surface.500" fontSize="xs">
                            {formatDuration(job.createdAt, job.completedAt)}
                          </Text>
                        </Flex>
                        
                        <VStack align="start" spacing={1}>
                          <Text color="white" fontWeight="medium" fontSize="sm" isTruncated>
                            {job.sourceConnection?.name || 'Unknown'}
                          </Text>
                          <HStack color="surface.500" fontSize="xs" spacing={1}>
                            <ArrowRightIcon />
                            <Text>{job.targetConnection?.name || 'Unknown'}</Text>
                          </HStack>
                        </VStack>

                        <HStack justify="space-between" fontSize="xs">
                          <Text color="surface.400">
                            {job.progress 
                              ? `${job.progress.completedTables}/${job.progress.totalTables} tables`
                              : 'No progress data'}
                          </Text>
                          <Text color="surface.500">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </Text>
                        </HStack>

                        {job.status === 'failed' && job.error && (
                          <Text color="red.400" fontSize="xs" noOfLines={2}>
                            Error: {job.error}
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </VStack>
          </VStack>
        )}

        {/* Stats Summary */}
        {syncJobs.length > 0 && (
          <Card bg="surface.800" borderColor="surface.700" mt={6}>
            <CardBody>
              <Flex 
                justify="space-around" 
                align="center" 
                textAlign="center"
                flexWrap="wrap"
                gap={4}
              >
                <VStack>
                  <Text color="white" fontSize="2xl" fontWeight="bold">
                    {syncJobs.length}
                  </Text>
                  <Text color="surface.400" fontSize="sm">Total Jobs</Text>
                </VStack>
                <VStack>
                  <Text color="green.400" fontSize="2xl" fontWeight="bold">
                    {syncJobs.filter(j => j.status === 'completed').length}
                  </Text>
                  <Text color="surface.400" fontSize="sm">Completed</Text>
                </VStack>
                <VStack>
                  <Text color="red.400" fontSize="2xl" fontWeight="bold">
                    {syncJobs.filter(j => j.status === 'failed').length}
                  </Text>
                  <Text color="surface.400" fontSize="sm">Failed</Text>
                </VStack>
                <VStack>
                  <Text color="blue.400" fontSize="2xl" fontWeight="bold">
                    {syncJobs.reduce((sum, j) => sum + (j.progress?.processedRows || 0), 0).toLocaleString()}
                  </Text>
                  <Text color="surface.400" fontSize="sm">Total Rows</Text>
                </VStack>
              </Flex>
            </CardBody>
          </Card>
        )}
      </Container>
    </Box>
  );
}

