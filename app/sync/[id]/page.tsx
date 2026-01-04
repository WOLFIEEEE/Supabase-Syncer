'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  Badge,
  Spinner,
  useToast,
  IconButton,
  Flex,
  Progress,
  SimpleGrid,
  Tooltip,
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

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const LoaderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

// Helper functions
function formatDuration(seconds: number): string {
  if (seconds < 0 || isNaN(seconds)) return '--';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--:--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
}

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

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'yellow.400', bg: 'yellow.900', label: 'Pending' },
  running: { color: 'blue.400', bg: 'blue.900', label: 'Running' },
  completed: { color: 'green.400', bg: 'green.900', label: 'Completed' },
  failed: { color: 'red.400', bg: 'red.900', label: 'Failed' },
  paused: { color: 'orange.400', bg: 'orange.900', label: 'Paused' },
};

export default function SyncDetailPage() {
  const [job, setJob] = useState<SyncJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<Date | null>(null);
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const jobId = params.id as string;
  
  // Track elapsed time
  useEffect(() => {
    if (job?.status === 'running' && job?.startedAt) {
      startTimeRef.current = new Date(job.startedAt);
      const timer = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime((Date.now() - startTimeRef.current.getTime()) / 1000);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [job?.status, job?.startedAt]);

  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/sync/${jobId}?logs=true&logLimit=20`);
      const data = await response.json();
      if (data.success) {
        setJob(data.data);
      }
    } catch {
      // Silent fail for polling
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(() => {
      if (job?.status === 'running' || job?.status === 'pending') {
        fetchJob();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchJob, job?.status]);

  const handleAction = async (action: 'start' | 'pause') => {
    setIsActioning(true);
    try {
      const response = await fetch(`/api/sync/${jobId}/${action}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast({ title: action === 'start' ? 'Sync started' : 'Pause requested', status: 'success', duration: 2000 });
        fetchJob();
      } else {
        toast({ title: `Failed to ${action}`, description: data.error, status: 'error', duration: 3000 });
      }
    } catch {
      toast({ title: `Failed to ${action}`, status: 'error', duration: 3000 });
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.950">
        <Flex justify="center" align="center" h="100vh">
          <Spinner size="lg" color="teal.400" />
        </Flex>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box minH="100vh" bg="gray.950" pt={20}>
        <Container maxW="2xl">
          <Text color="gray.500" textAlign="center">Sync job not found</Text>
        </Container>
      </Box>
    );
  }

  const progress = job.progress;
  const enabledTables = job.tablesConfig.filter(t => t.enabled);
  const completedCount = progress?.completedTables || 0;
  const totalCount = progress?.totalTables || enabledTables.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalProcessed = (progress?.insertedRows || 0) + (progress?.updatedRows || 0) + (progress?.skippedRows || 0);
  const speed = elapsedTime > 0 ? Math.round(totalProcessed / elapsedTime) : 0;
  const status = statusConfig[job.status] || statusConfig.pending;

  return (
    <Box minH="100vh" bg="gray.950">
      {/* Minimal Header */}
      <Box borderBottom="1px solid" borderColor="gray.800" bg="gray.900/50" backdropFilter="blur(10px)" position="sticky" top={0} zIndex={10}>
        <Container maxW="3xl" py={3}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <IconButton
                aria-label="Back"
                icon={<ArrowLeftIcon />}
                variant="ghost"
                size="sm"
                color="gray.400"
                onClick={() => router.push('/')}
              />
              <VStack align="start" spacing={0}>
                <Text color="white" fontWeight="semibold" fontSize="sm">Sync Job</Text>
                <Code fontSize="xs" bg="transparent" color="gray.500" p={0}>{job.id.slice(0, 8)}</Code>
              </VStack>
            </HStack>
            
            <HStack spacing={2}>
              <Badge 
                bg={status.bg} 
                color={status.color} 
                px={3} 
                py={1} 
                borderRadius="full"
                fontSize="xs"
                fontWeight="medium"
              >
                {status.label}
              </Badge>
              
              {job.status === 'running' && (
                <Button size="xs" colorScheme="orange" variant="ghost" onClick={() => handleAction('pause')} isLoading={isActioning}>
                  <PauseIcon />
                </Button>
              )}
              {['paused', 'failed', 'pending'].includes(job.status) && (
                <Button size="xs" colorScheme="teal" variant="ghost" onClick={() => handleAction('start')} isLoading={isActioning}>
                  <PlayIcon />
                </Button>
              )}
              <IconButton
                aria-label="Refresh"
                icon={<RefreshIcon />}
                variant="ghost"
                size="xs"
                color="gray.500"
                onClick={fetchJob}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="3xl" py={6}>
        <VStack spacing={5} align="stretch">
          
          {/* Connection Flow */}
          <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <HStack justify="center" spacing={4} py={4}>
              <VStack spacing={1}>
                <Badge 
                  colorScheme={job.sourceConnection?.environment === 'production' ? 'red' : 'green'} 
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  {job.sourceConnection?.name || 'Source'}
                </Badge>
                <Text fontSize="xs" color="gray.600">{job.sourceConnection?.environment}</Text>
              </VStack>
              
              <Box color="gray.600" px={2}>→</Box>
              
              <VStack spacing={1}>
                <Badge 
                  colorScheme={job.targetConnection?.environment === 'production' ? 'red' : 'green'} 
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  {job.targetConnection?.name || 'Target'}
                </Badge>
                <Text fontSize="xs" color="gray.600">{job.targetConnection?.environment}</Text>
              </VStack>
            </HStack>
          </MotionBox>

          {/* Progress Section */}
          {(job.status === 'running' || job.status === 'completed' || progress) && (
            <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="xl" overflow="hidden">
                <CardBody p={5}>
                  {/* Current Operation */}
                  {job.status === 'running' && progress?.currentTable && (
                    <HStack spacing={2} mb={4}>
                      <Box color="teal.400" className="pulse"><LoaderIcon /></Box>
                      <Text color="gray.400" fontSize="sm">
                        Processing <Code bg="gray.800" color="teal.300" px={2} py={0.5} borderRadius="md" fontSize="xs">{progress.currentTable}</Code>
                      </Text>
                    </HStack>
                  )}
                  
                  {/* Progress Bar */}
                  <VStack align="stretch" spacing={2} mb={5}>
                    <Flex justify="space-between" align="center">
                      <Text color="gray.500" fontSize="xs" fontWeight="medium">PROGRESS</Text>
                      <Text color="white" fontSize="sm" fontWeight="semibold">{progressPercent}%</Text>
                    </Flex>
                    <Progress 
                      value={progressPercent} 
                      size="sm"
                      borderRadius="full"
                      bg="gray.800"
                      sx={{ '& > div': { bg: job.status === 'completed' ? 'green.400' : 'teal.400' } }}
                    />
                    <Text color="gray.600" fontSize="xs">
                      {completedCount} of {totalCount} tables
                    </Text>
                  </VStack>
                  
                  {/* Stats Grid */}
                  <SimpleGrid columns={4} spacing={4}>
                    <VStack align="start" spacing={0}>
                      <Text color="gray.600" fontSize="xs" fontWeight="medium">INSERTED</Text>
                      <Text color="green.400" fontSize="xl" fontWeight="bold">{(progress?.insertedRows || 0).toLocaleString()}</Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text color="gray.600" fontSize="xs" fontWeight="medium">UPDATED</Text>
                      <Text color="blue.400" fontSize="xl" fontWeight="bold">{(progress?.updatedRows || 0).toLocaleString()}</Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text color="gray.600" fontSize="xs" fontWeight="medium">SKIPPED</Text>
                      <Text color="yellow.400" fontSize="xl" fontWeight="bold">{(progress?.skippedRows || 0).toLocaleString()}</Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text color="gray.600" fontSize="xs" fontWeight="medium">ERRORS</Text>
                      <Text color={progress?.errors ? 'red.400' : 'gray.600'} fontSize="xl" fontWeight="bold">{progress?.errors || 0}</Text>
                    </VStack>
                  </SimpleGrid>
                  
                  {/* Time Stats */}
                  {job.status === 'running' && (
                    <HStack spacing={6} mt={5} pt={4} borderTop="1px solid" borderColor="gray.800">
                      <HStack spacing={2}>
                        <ClockIcon />
                        <Text color="gray.500" fontSize="xs">{formatDuration(elapsedTime)}</Text>
                      </HStack>
                      <Text color="gray.600" fontSize="xs">•</Text>
                      <Text color="gray.500" fontSize="xs">{speed} rows/sec</Text>
                    </HStack>
                  )}
                </CardBody>
              </Card>
            </MotionBox>
          )}

          {/* Tables List */}
          <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="xl">
              <CardBody p={4}>
                <Text color="gray.500" fontSize="xs" fontWeight="medium" mb={3}>TABLES ({enabledTables.length})</Text>
                <VStack align="stretch" spacing={1}>
                  {enabledTables.map((table, idx) => {
                    const isComplete = progress?.currentTable 
                      ? enabledTables.findIndex(t => t.tableName === progress.currentTable) > idx
                      : false;
                    const isCurrent = progress?.currentTable === table.tableName;
                    
                    return (
                      <HStack 
                        key={table.tableName} 
                        justify="space-between" 
                        py={2} 
                        px={3}
                        bg={isCurrent ? 'teal.900/30' : 'transparent'}
                        borderRadius="md"
                        borderLeft="2px solid"
                        borderColor={isComplete ? 'green.500' : isCurrent ? 'teal.400' : 'transparent'}
                      >
                        <Text 
                          fontFamily="mono" 
                          fontSize="sm" 
                          color={isComplete ? 'green.400' : isCurrent ? 'teal.300' : 'gray.500'}
                        >
                          {table.tableName}
                        </Text>
                        {isComplete && <Box color="green.500"><CheckCircleIcon /></Box>}
                        {isCurrent && <Spinner size="xs" color="teal.400" />}
                      </HStack>
                    );
                  })}
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>

          {/* Logs */}
          <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="xl">
              <CardBody p={4}>
                <Text color="gray.500" fontSize="xs" fontWeight="medium" mb={3}>ACTIVITY LOG</Text>
                {job.logs.length === 0 ? (
                  <Text color="gray.600" fontSize="sm">No activity yet</Text>
                ) : (
                  <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
                    {job.logs.map((log) => (
                      <HStack key={log.id} spacing={3} align="start">
                        <Text color="gray.600" fontSize="xs" fontFamily="mono" w="70px" flexShrink={0}>
                          {formatTime(log.createdAt)}
                        </Text>
                        <Box 
                          w="6px" 
                          h="6px" 
                          borderRadius="full" 
                          mt={1.5}
                          bg={log.level === 'error' ? 'red.500' : log.level === 'warn' ? 'yellow.500' : 'teal.500'}
                        />
                        <Text 
                          fontSize="sm" 
                          color={log.level === 'error' ? 'red.400' : log.level === 'warn' ? 'yellow.400' : 'gray.400'}
                          flex={1}
                        >
                          {log.message}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </MotionBox>
        </VStack>
      </Container>
      
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </Box>
  );
}
