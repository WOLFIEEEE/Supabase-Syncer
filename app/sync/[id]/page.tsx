'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  CardHeader,
  Badge,
  Spinner,
  useToast,
  IconButton,
  Flex,
  Progress,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

// Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

interface SyncProgress {
  totalTables: number;
  completedTables: number;
  currentTable: string | null;
  totalRows: number;
  processedRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  errors: number;
}

interface SyncLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface SyncJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  direction: 'one_way' | 'two_way';
  tablesConfig: { tableName: string; enabled: boolean }[];
  progress: SyncProgress | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  sourceConnection?: { id: string; name: string; environment: string };
  targetConnection?: { id: string; name: string; environment: string };
  logs: SyncLog[];
}

const statusColors: Record<string, string> = {
  pending: 'yellow',
  running: 'blue',
  completed: 'green',
  failed: 'red',
  paused: 'orange',
};

const logColors: Record<string, string> = {
  info: 'blue.300',
  warn: 'yellow.300',
  error: 'red.300',
};

export default function SyncDetailPage() {
  const [job, setJob] = useState<SyncJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const jobId = params.id as string;

  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/sync/${jobId}?logs=true&logLimit=50`);
      const data = await response.json();
      
      if (data.success) {
        setJob(data.data);
      } else {
        toast({
          title: 'Failed to load job',
          description: data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to load job',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [jobId, toast]);

  useEffect(() => {
    fetchJob();
    
    // Poll for updates if job is running
    const interval = setInterval(() => {
      if (job?.status === 'running' || job?.status === 'pending') {
        fetchJob();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchJob, job?.status]);

  const handleStart = async () => {
    setIsActioning(true);
    try {
      const response = await fetch(`/api/sync/${jobId}/start`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Sync started',
          status: 'success',
          duration: 2000,
        });
        fetchJob();
      } else {
        toast({
          title: 'Failed to start sync',
          description: data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to start sync',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handlePause = async () => {
    setIsActioning(true);
    try {
      const response = await fetch(`/api/sync/${jobId}/pause`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Pause requested',
          description: 'Job will pause after current batch',
          status: 'info',
          duration: 3000,
        });
        fetchJob();
      } else {
        toast({
          title: 'Failed to pause sync',
          description: data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to pause sync',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" className="gradient-mesh">
        <Flex justify="center" align="center" h="100vh">
          <Spinner size="xl" color="brand.400" />
        </Flex>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box minH="100vh" className="gradient-mesh">
        <Container maxW="4xl" py={8}>
          <Card bg="surface.800" borderColor="surface.700">
            <CardBody>
              <Text color="surface.400">Sync job not found</Text>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  const progress = job.progress;
  const progressPercent = progress 
    ? Math.round((progress.completedTables / progress.totalTables) * 100)
    : 0;

  return (
    <Box minH="100vh" className="gradient-mesh">
      {/* Header */}
      <Box 
        as="header" 
        bg="surface.800" 
        borderBottomWidth="1px" 
        borderColor="surface.700"
      >
        <Container maxW="4xl" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <IconButton
                aria-label="Back"
                icon={<ArrowLeftIcon />}
                variant="ghost"
                onClick={() => router.push('/')}
              />
              <VStack align="start" spacing={0}>
                <Heading size="md" color="white">
                  Sync Job
                </Heading>
                <Code fontSize="xs" bg="surface.700" color="surface.400">
                  {job.id.slice(0, 8)}...
                </Code>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Badge colorScheme={statusColors[job.status]} fontSize="md" px={3} py={1}>
                {job.status.toUpperCase()}
              </Badge>
              {job.status === 'running' && (
                <Button
                  leftIcon={<PauseIcon />}
                  size="sm"
                  colorScheme="orange"
                  onClick={handlePause}
                  isLoading={isActioning}
                >
                  Pause
                </Button>
              )}
              {(job.status === 'paused' || job.status === 'failed') && (
                <Button
                  leftIcon={<PlayIcon />}
                  size="sm"
                  colorScheme="teal"
                  onClick={handleStart}
                  isLoading={isActioning}
                >
                  Resume
                </Button>
              )}
              {job.status === 'pending' && (
                <Button
                  leftIcon={<PlayIcon />}
                  size="sm"
                  colorScheme="teal"
                  onClick={handleStart}
                  isLoading={isActioning}
                >
                  Start
                </Button>
              )}
              <IconButton
                aria-label="Refresh"
                icon={<RefreshIcon />}
                variant="ghost"
                size="sm"
                onClick={fetchJob}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Overview Card */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" wrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      <Text color="surface.400" fontSize="sm">Source</Text>
                      <Badge colorScheme={job.sourceConnection?.environment === 'production' ? 'red' : 'green'}>
                        {job.sourceConnection?.name || 'Unknown'}
                      </Badge>
                    </VStack>
                    <Box color="surface.500"><ArrowRightIcon /></Box>
                    <VStack align="start" spacing={1}>
                      <Text color="surface.400" fontSize="sm">Target</Text>
                      <Badge colorScheme={job.targetConnection?.environment === 'production' ? 'red' : 'green'}>
                        {job.targetConnection?.name || 'Unknown'}
                      </Badge>
                    </VStack>
                    <VStack align="start" spacing={1}>
                      <Text color="surface.400" fontSize="sm">Direction</Text>
                      <Text color="white">{job.direction === 'one_way' ? 'One-Way' : 'Two-Way'}</Text>
                    </VStack>
                    <VStack align="start" spacing={1}>
                      <Text color="surface.400" fontSize="sm">Created</Text>
                      <Text color="white" fontSize="sm">
                        {new Date(job.createdAt).toLocaleString()}
                      </Text>
                    </VStack>
                  </HStack>

                  {(job.status === 'running' || progress) && (
                    <>
                      <Divider borderColor="surface.700" />
                      
                      {/* Progress Bar */}
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text color="surface.400" fontSize="sm">
                            {progress?.currentTable 
                              ? `Processing: ${progress.currentTable}` 
                              : 'Processing...'}
                          </Text>
                          <Text color="white" fontSize="sm">
                            {progressPercent}%
                          </Text>
                        </HStack>
                        <Progress 
                          value={progressPercent} 
                          colorScheme="teal" 
                          size="sm" 
                          borderRadius="full"
                          hasStripe={job.status === 'running'}
                          isAnimated={job.status === 'running'}
                        />
                      </VStack>

                      {/* Stats */}
                      <HStack spacing={8} wrap="wrap">
                        <VStack align="start" spacing={0}>
                          <Text color="surface.400" fontSize="xs">Tables</Text>
                          <Text color="white" fontSize="lg" fontWeight="bold">
                            {progress?.completedTables || 0}/{progress?.totalTables || 0}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text color="surface.400" fontSize="xs">Inserted</Text>
                          <Text color="green.400" fontSize="lg" fontWeight="bold">
                            {(progress?.insertedRows || 0).toLocaleString()}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text color="surface.400" fontSize="xs">Updated</Text>
                          <Text color="blue.400" fontSize="lg" fontWeight="bold">
                            {(progress?.updatedRows || 0).toLocaleString()}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text color="surface.400" fontSize="xs">Skipped</Text>
                          <Text color="yellow.400" fontSize="lg" fontWeight="bold">
                            {(progress?.skippedRows || 0).toLocaleString()}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text color="surface.400" fontSize="xs">Errors</Text>
                          <Text color="red.400" fontSize="lg" fontWeight="bold">
                            {progress?.errors || 0}
                          </Text>
                        </VStack>
                      </HStack>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>

          {/* Tables Card */}
          <Card bg="surface.800" borderColor="surface.700">
            <CardHeader>
              <Heading size="sm" color="white">Tables</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th color="surface.400">Table Name</Th>
                    <Th color="surface.400">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {job.tablesConfig
                    .filter(t => t.enabled)
                    .map((table) => {
                      const isComplete = progress?.currentTable 
                        ? job.tablesConfig
                            .filter(t => t.enabled)
                            .findIndex(t => t.tableName === progress.currentTable) > 
                          job.tablesConfig
                            .filter(t => t.enabled)
                            .findIndex(t => t.tableName === table.tableName)
                        : false;
                      const isCurrent = progress?.currentTable === table.tableName;
                      
                      return (
                        <Tr key={table.tableName}>
                          <Td fontFamily="mono" color="white">{table.tableName}</Td>
                          <Td>
                            {isComplete ? (
                              <Badge colorScheme="green">Complete</Badge>
                            ) : isCurrent ? (
                              <Badge colorScheme="blue">Processing</Badge>
                            ) : (
                              <Badge colorScheme="gray">Pending</Badge>
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                </Tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Logs Card */}
          <Card bg="surface.800" borderColor="surface.700">
            <CardHeader>
              <Heading size="sm" color="white">Logs</Heading>
            </CardHeader>
            <CardBody pt={0}>
              {job.logs.length === 0 ? (
                <Text color="surface.500">No logs yet</Text>
              ) : (
                <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto">
                  {job.logs.map((log) => (
                    <HStack 
                      key={log.id} 
                      spacing={3} 
                      p={2} 
                      bg="surface.900" 
                      borderRadius="md"
                      align="start"
                    >
                      <Text color="surface.500" fontSize="xs" fontFamily="mono" whiteSpace="nowrap">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </Text>
                      <Badge 
                        colorScheme={log.level === 'error' ? 'red' : log.level === 'warn' ? 'yellow' : 'blue'}
                        fontSize="xs"
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                      <Text color={logColors[log.level]} fontSize="sm" flex={1}>
                        {log.message}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

