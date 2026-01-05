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

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
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
  pending: { color: 'yellow.300', bg: 'surface.700', label: 'Pending' },
  running: { color: 'brand.400', bg: 'surface.700', label: 'Running' },
  completed: { color: 'green.400', bg: 'surface.700', label: 'Completed' },
  failed: { color: 'red.400', bg: 'surface.700', label: 'Failed' },
  paused: { color: 'orange.400', bg: 'surface.700', label: 'Paused' },
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

  const handleAction = async (action: 'start' | 'pause' | 'stop') => {
    setIsActioning(true);
    try {
      const response = await fetch(`/api/sync/${jobId}/${action}`, { method: 'POST' });
      
      // Handle streaming response for start action
      if (action === 'start' && response.headers.get('content-type')?.includes('text/event-stream')) {
        toast({ title: 'Sync started', status: 'success', duration: 2000 });
        
        // Read the stream in the background
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          
          const readStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const text = decoder.decode(value);
                const lines = text.split('\n');
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6));
                      if (data.type === 'complete') {
                        toast({ 
                          title: data.success ? 'Sync completed' : 'Sync failed', 
                          status: data.success ? 'success' : 'error', 
                          duration: 3000 
                        });
                        fetchJob();
                      } else if (data.type === 'error') {
                        toast({ title: 'Sync error', description: data.error, status: 'error', duration: 5000 });
                        fetchJob();
                      }
                    } catch {
                      // Ignore parse errors
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Stream read error:', err);
            } finally {
              setIsActioning(false);
            }
          };
          
          // Don't await - let it run in background
          readStream();
          fetchJob(); // Immediately refresh to show running status
          return;
        }
      }
      
      // Handle regular JSON response
      const data = await response.json();
      if (data.success) {
        const messages: Record<string, string> = {
          start: 'Sync started',
          pause: 'Pause requested',
          stop: 'Sync stopped',
        };
        toast({ title: messages[action], status: action === 'stop' ? 'warning' : 'success', duration: 2000 });
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this sync job? This action cannot be undone.')) {
      return;
    }
    
    setIsActioning(true);
    try {
      const response = await fetch(`/api/sync/${jobId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Sync job deleted', status: 'success', duration: 2000 });
        router.push('/');
      } else {
        toast({ title: 'Failed to delete', description: data.error, status: 'error', duration: 3000 });
      }
    } catch {
      toast({ title: 'Failed to delete', status: 'error', duration: 3000 });
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <Flex minH="100vh" bg="surface.900" justify="center" align="center">
        <VStack spacing={3}>
          <Spinner size="lg" color="brand.400" />
          <Text color="surface.400" fontSize="sm">Loading sync job...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!job) {
    return (
      <Flex minH="100vh" bg="surface.900" justify="center" align="center">
        <VStack spacing={3}>
          <Text color="surface.400" fontSize="lg">Sync job not found</Text>
          <Button size="sm" onClick={() => router.push('/')}>Go back home</Button>
        </VStack>
      </Flex>
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
    <Flex direction="column" h="100vh" bg="surface.900" overflow="hidden">
      {/* Header */}
      <Box 
        as="header"
        bg="surface.800" 
        borderBottomWidth="1px" 
        borderColor="surface.700"
        flexShrink={0}
      >
        <Flex justify="space-between" align="center" px={3} py={1.5}>
          <HStack spacing={3}>
            <IconButton
              aria-label="Back"
              icon={<ArrowLeftIcon />}
              variant="ghost"
              size="sm"
              color="surface.400"
              _hover={{ bg: 'surface.700' }}
              onClick={() => router.push('/')}
            />
            <VStack align="start" spacing={0}>
              <Text color="white" fontWeight="semibold" fontSize="sm">Sync Job</Text>
              <Code fontSize="xs" bg="transparent" color="surface.500" p={0}>{job.id.slice(0, 8)}</Code>
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
              
              {/* Play/Resume button for non-running jobs */}
              {['paused', 'failed', 'pending'].includes(job.status) && (
                <Tooltip label="Start/Resume sync">
                  <Button size="xs" colorScheme="teal" variant="ghost" onClick={() => handleAction('start')} isLoading={isActioning}>
                    <PlayIcon />
                  </Button>
                </Tooltip>
              )}
              
              {/* Pause button for running jobs */}
              {job.status === 'running' && (
                <Tooltip label="Pause sync">
                  <Button size="xs" colorScheme="orange" variant="ghost" onClick={() => handleAction('pause')} isLoading={isActioning}>
                    <PauseIcon />
                  </Button>
                </Tooltip>
              )}
              
              {/* Force stop button for running/pending jobs */}
              {['running', 'pending'].includes(job.status) && (
                <Tooltip label="Force stop">
                  <Button 
                    size="xs" 
                    colorScheme="red" 
                    variant="ghost" 
                    onClick={() => handleAction('stop')} 
                    isLoading={isActioning}
                  >
                    <StopIcon />
                  </Button>
                </Tooltip>
              )}
              
              {/* Refresh button */}
              <Tooltip label="Refresh">
                <IconButton
                  aria-label="Refresh"
                  icon={<RefreshIcon />}
                  variant="ghost"
                  size="xs"
                  color="gray.500"
                  onClick={fetchJob}
                />
              </Tooltip>
              
              {/* Delete button - only for completed/failed/paused jobs */}
              {['completed', 'failed', 'paused'].includes(job.status) && (
                <Tooltip label="Delete job">
                  <Button 
                    size="xs" 
                    colorScheme="red" 
                    variant="ghost" 
                    onClick={handleDelete} 
                    isLoading={isActioning}
                  >
                    <TrashIcon />
                  </Button>
                </Tooltip>
              )}
            </HStack>
          </Flex>
      </Box>

      {/* Full Width Two-Column Layout - Fits in viewport */}
      <Flex flex={1} overflow="hidden">
        {/* Left Panel - Main Details (narrower) */}
        <Box 
          w={{ base: '100%', lg: '35%' }} 
          p={3} 
          display="flex"
          flexDirection="column"
          borderRight={{ lg: '1px solid' }}
          borderColor="surface.700"
          overflow="hidden"
        >
          <VStack spacing={3} align="stretch" h="100%">
            {/* Connection Flow - Compact */}
            <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} flexShrink={0}>
              <Card bg="surface.800" borderWidth="1px" borderColor="surface.700" borderRadius="lg">
                <CardBody py={2} px={3}>
                  <HStack justify="center" spacing={3}>
                    <VStack spacing={0}>
                      <Badge 
                        colorScheme={job.sourceConnection?.environment === 'production' ? 'red' : 'green'} 
                        variant="subtle"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        fontSize="xs"
                      >
                        {job.sourceConnection?.name || 'Source'}
                      </Badge>
                      <Text fontSize="2xs" color="surface.500">{job.sourceConnection?.environment}</Text>
                    </VStack>
                    
                    <Box color="surface.500" fontSize="md">→</Box>
                    
                    <VStack spacing={0}>
                      <Badge 
                        colorScheme={job.targetConnection?.environment === 'production' ? 'red' : 'green'} 
                        variant="subtle"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        fontSize="xs"
                      >
                        {job.targetConnection?.name || 'Target'}
                      </Badge>
                      <Text fontSize="2xs" color="surface.500">{job.targetConnection?.environment}</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            </MotionBox>

            {/* Progress Section - Compact */}
            <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} flexShrink={0}>
              <Card bg="surface.800" borderWidth="1px" borderColor="surface.700" borderRadius="lg">
                <CardBody p={3}>
                  {/* Current Operation */}
                  {job.status === 'running' && progress?.currentTable && (
                    <HStack spacing={2} mb={2}>
                      <Box color="brand.400" className="pulse"><LoaderIcon /></Box>
                      <Text color="surface.300" fontSize="xs">
                        <Code bg="surface.700" color="brand.300" px={1} py={0.5} borderRadius="md" fontSize="xs">{progress.currentTable}</Code>
                      </Text>
                    </HStack>
                  )}
                  
                  {/* Progress Bar */}
                  <VStack align="stretch" spacing={0.5} mb={3}>
                    <Flex justify="space-between" align="center">
                      <Text color="surface.400" fontSize="2xs" fontWeight="medium">PROGRESS</Text>
                      <Text color="white" fontSize="xs" fontWeight="bold">{progressPercent}%</Text>
                    </Flex>
                    <Progress 
                      value={progressPercent} 
                      size="xs"
                      borderRadius="full"
                      bg="surface.700"
                      sx={{ '& > div': { bg: job.status === 'completed' ? 'green.400' : 'brand.400' } }}
                    />
                    <Text color="surface.500" fontSize="2xs">
                      {completedCount} of {totalCount} tables
                    </Text>
                  </VStack>
                  
                  {/* Stats Grid - Compact */}
                  <SimpleGrid columns={4} spacing={1}>
                    <VStack align="center" spacing={0} p={1.5} bg="surface.900" borderRadius="md">
                      <Text color="green.400" fontSize="sm" fontWeight="bold">{(progress?.insertedRows || 0).toLocaleString()}</Text>
                      <Text color="surface.500" fontSize="2xs">INS</Text>
                    </VStack>
                    <VStack align="center" spacing={0} p={1.5} bg="surface.900" borderRadius="md">
                      <Text color="blue.400" fontSize="sm" fontWeight="bold">{(progress?.updatedRows || 0).toLocaleString()}</Text>
                      <Text color="surface.500" fontSize="2xs">UPD</Text>
                    </VStack>
                    <VStack align="center" spacing={0} p={1.5} bg="surface.900" borderRadius="md">
                      <Text color="yellow.400" fontSize="sm" fontWeight="bold">{(progress?.skippedRows || 0).toLocaleString()}</Text>
                      <Text color="surface.500" fontSize="2xs">SKIP</Text>
                    </VStack>
                    <VStack align="center" spacing={0} p={1.5} bg="surface.900" borderRadius="md">
                      <Text color={progress?.errors ? 'red.400' : 'surface.500'} fontSize="sm" fontWeight="bold">{progress?.errors || 0}</Text>
                      <Text color="surface.500" fontSize="2xs">ERR</Text>
                    </VStack>
                  </SimpleGrid>
                  
                  {/* Time Stats */}
                  {job.status === 'running' && (
                    <HStack spacing={3} mt={2} pt={2} borderTop="1px solid" borderColor="surface.700" justify="center">
                      <HStack spacing={1}>
                        <ClockIcon />
                        <Text color="surface.400" fontSize="2xs">{formatDuration(elapsedTime)}</Text>
                      </HStack>
                      <Text color="surface.600" fontSize="2xs">•</Text>
                      <Text color="surface.400" fontSize="2xs">{speed} rows/sec</Text>
                    </HStack>
                  )}
                </CardBody>
              </Card>
            </MotionBox>

            {/* Tables List - Takes remaining space */}
            <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} flex={1} minH={0}>
              <Card bg="surface.800" borderWidth="1px" borderColor="surface.700" borderRadius="lg" h="100%" display="flex" flexDirection="column">
                <CardBody p={2} display="flex" flexDirection="column" flex={1} minH={0}>
                  <Flex justify="space-between" align="center" mb={1.5} flexShrink={0}>
                    <Text color="surface.400" fontSize="2xs" fontWeight="medium">TABLES</Text>
                    <Text color="surface.500" fontSize="2xs">{completedCount}/{enabledTables.length}</Text>
                  </Flex>
                  <VStack align="stretch" spacing={0} flex={1} overflowY="auto" minH={0}>
                    {enabledTables.map((table, idx) => {
                      const isComplete = progress?.currentTable 
                        ? enabledTables.findIndex(t => t.tableName === progress.currentTable) > idx
                        : false;
                      const isCurrent = progress?.currentTable === table.tableName;
                      
                      return (
                        <HStack 
                          key={table.tableName} 
                          justify="space-between" 
                          py={1} 
                          px={1.5}
                          bg={isCurrent ? 'brand.900/30' : 'transparent'}
                          borderRadius="sm"
                          borderLeft="2px solid"
                          borderColor={isComplete ? 'green.500' : isCurrent ? 'brand.400' : 'transparent'}
                        >
                          <Text 
                            fontFamily="mono" 
                            fontSize="2xs" 
                            color={isComplete ? 'green.400' : isCurrent ? 'brand.300' : 'surface.400'}
                            isTruncated
                          >
                            {table.tableName}
                          </Text>
                          {isComplete && <Box color="green.500" fontSize="xs"><CheckCircleIcon /></Box>}
                          {isCurrent && <Spinner size="xs" color="brand.400" />}
                        </HStack>
                      );
                    })}
                  </VStack>
                </CardBody>
              </Card>
            </MotionBox>
          </VStack>
        </Box>

        {/* Right Panel - Activity Log (wider, fills remaining space) */}
        <Box 
          w={{ base: '100%', lg: '65%' }} 
          display={{ base: 'none', lg: 'flex' }}
          flexDirection="column"
          bg="surface.900"
          overflow="hidden"
        >
          <Flex 
            justify="space-between" 
            align="center" 
            px={3} 
            py={2} 
            borderBottom="1px solid" 
            borderColor="surface.700"
            bg="surface.800"
            flexShrink={0}
          >
            <HStack spacing={2}>
              <Text color="white" fontSize="sm" fontWeight="semibold">Activity Log</Text>
              <Badge colorScheme="brand" variant="subtle" fontSize="2xs">{job.logs.length}</Badge>
            </HStack>
            <HStack spacing={1}>
              {job.logs.some(l => l.level === 'error') && (
                <Badge colorScheme="red" variant="solid" fontSize="2xs" px={1.5}>
                  {job.logs.filter(l => l.level === 'error').length} errors
                </Badge>
              )}
              {job.logs.some(l => l.level === 'warn') && (
                <Badge colorScheme="yellow" variant="solid" fontSize="2xs" px={1.5}>
                  {job.logs.filter(l => l.level === 'warn').length} warnings
                </Badge>
              )}
            </HStack>
          </Flex>
          
          <Box flex={1} overflowY="auto" p={2} minH={0}>
            {job.logs.length === 0 ? (
              <Flex justify="center" align="center" h="100%" color="surface.500">
                <VStack spacing={2}>
                  <ClockIcon />
                  <Text fontSize="xs">Waiting for activity...</Text>
                </VStack>
              </Flex>
            ) : (
              <VStack align="stretch" spacing={0.5}>
                {job.logs.map((log) => (
                  <HStack 
                    key={log.id} 
                    spacing={2} 
                    align="start" 
                    py={1}
                    px={2}
                    bg={log.level === 'error' ? 'red.900/20' : log.level === 'warn' ? 'yellow.900/20' : 'transparent'}
                    borderRadius="sm"
                    borderLeft="2px solid"
                    borderColor={log.level === 'error' ? 'red.500' : log.level === 'warn' ? 'yellow.500' : 'surface.700'}
                  >
                    <Text color="surface.500" fontSize="2xs" fontFamily="mono" w="65px" flexShrink={0}>
                      {formatTime(log.createdAt)}
                    </Text>
                    <Badge 
                      colorScheme={log.level === 'error' ? 'red' : log.level === 'warn' ? 'yellow' : 'gray'}
                      variant="subtle"
                      fontSize="2xs"
                      px={1}
                      h="16px"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    <Text 
                      fontSize="2xs" 
                      color={log.level === 'error' ? 'red.300' : log.level === 'warn' ? 'yellow.300' : 'surface.300'}
                      flex={1}
                      fontFamily="mono"
                      wordBreak="break-word"
                    >
                      {log.message}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        </Box>
      </Flex>
      
      {/* Mobile Log View - Hidden on desktop */}
      <Box display={{ base: 'block', lg: 'none' }} p={2} overflowY="auto" flex={1}>
        <Card bg="surface.800" borderWidth="1px" borderColor="surface.700" borderRadius="lg" h="100%">
          <CardBody p={2} display="flex" flexDirection="column" h="100%">
            <Flex justify="space-between" align="center" mb={1} flexShrink={0}>
              <Text color="surface.400" fontSize="2xs" fontWeight="medium">ACTIVITY LOG</Text>
              <Text color="surface.500" fontSize="2xs">{job.logs.length} entries</Text>
            </Flex>
            <VStack align="stretch" spacing={0.5} flex={1} overflowY="auto">
              {job.logs.slice(0, 50).map((log) => (
                <HStack key={log.id} spacing={2} align="start" py={0.5}>
                  <Text color="surface.500" fontSize="2xs" fontFamily="mono" w="55px" flexShrink={0}>
                    {formatTime(log.createdAt)}
                  </Text>
                  <Text 
                    fontSize="2xs" 
                    color={log.level === 'error' ? 'red.300' : log.level === 'warn' ? 'yellow.300' : 'surface.300'}
                    flex={1}
                  >
                    {log.message}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </Box>
      
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
    </Flex>
  );
}
