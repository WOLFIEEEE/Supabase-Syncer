'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Badge,
  Spinner,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Button,
  Flex,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

// Icons
const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

interface PingResult {
  connectionId: string;
  connectionName: string;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: string;
}

interface StatusData {
  lastRun: string | null;
  nextRun: string | null;
  stats: {
    totalConnections: number;
    activeKeepAlive: number;
    lastPingSuccess: number;
    lastPingFailed: number;
  };
  recentPings: PingResult[];
  systemStatus: 'operational' | 'degraded' | 'down';
}

export default function StatusPage() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const fetchStatus = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      
      if (data.success) {
        setStatusData(data.data);
        if (showToast) {
          toast({
            title: 'Status refreshed',
            status: 'success',
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStatus(), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const formatRelativeTime = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'operational': return 'green';
      case 'degraded': return 'yellow';
      case 'down': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'operational': return 'All Systems Operational';
      case 'degraded': return 'Partial Outage';
      case 'down': return 'Major Outage';
      default: return 'Unknown';
    }
  };

  return (
    <Box minH="100vh" className="gradient-mesh">
      {/* Header */}
      <Box 
        as="header" 
        bg="surface.800" 
        borderBottomWidth="1px" 
        borderColor="surface.700"
      >
        <Container maxW="5xl" py={4} px={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="center">
            <Link href="/">
              <HStack spacing={3} cursor="pointer" _hover={{ opacity: 0.8 }}>
                <svg 
                  width="36" 
                  height="36" 
                  viewBox="0 0 48 48" 
                  fill="none"
                >
                  <defs>
                    <linearGradient id="spg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14B8A6"/>
                      <stop offset="100%" stopColor="#0D9488"/>
                    </linearGradient>
                    <linearGradient id="slg" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="#5EEAD4"/>
                      <stop offset="50%" stopColor="#2DD4BF"/>
                      <stop offset="100%" stopColor="#5EEAD4"/>
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="22" fill="url(#spg)"/>
                  <path 
                    d="M8 24 L14 24 L17 18 L20 30 L24 12 L28 36 L31 18 L34 24 L40 24" 
                    stroke="url(#slg)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <VStack align="start" spacing={0}>
                  <Heading size="md" fontWeight="bold" color="white" letterSpacing="-0.02em">
                    Pulse
                  </Heading>
                  <Text fontSize="xs" color="surface.400">Status</Text>
                </VStack>
              </HStack>
            </Link>
            
            <Button
              leftIcon={<RefreshIcon />}
              variant="ghost"
              size="sm"
              onClick={() => fetchStatus(true)}
              isLoading={isRefreshing}
            >
              Refresh
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="5xl" py={8} px={{ base: 4, md: 6 }}>
        {isLoading ? (
          <Flex justify="center" align="center" minH="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.400" />
              <Text color="surface.400">Loading status...</Text>
            </VStack>
          </Flex>
        ) : statusData ? (
          <VStack spacing={8} align="stretch">
            {/* System Status Banner */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                bg={`${getStatusColor(statusData.systemStatus)}.900`} 
                borderColor={`${getStatusColor(statusData.systemStatus)}.700`}
                borderWidth="1px"
              >
                <CardBody py={6}>
                  <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
                    <HStack spacing={4}>
                      <Box 
                        p={3} 
                        borderRadius="full" 
                        bg={`${getStatusColor(statusData.systemStatus)}.800`}
                        color={`${getStatusColor(statusData.systemStatus)}.200`}
                      >
                        {statusData.systemStatus === 'operational' ? <CheckIcon /> : <XIcon />}
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Heading size="md" color="white">
                          {getStatusText(statusData.systemStatus)}
                        </Heading>
                        <Text color={`${getStatusColor(statusData.systemStatus)}.200`} fontSize="sm">
                          Keep-Alive Service
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge 
                      colorScheme={getStatusColor(statusData.systemStatus)} 
                      fontSize="sm" 
                      px={3} 
                      py={1}
                    >
                      {statusData.systemStatus.toUpperCase()}
                    </Badge>
                  </Flex>
                </CardBody>
              </Card>
            </MotionBox>

            {/* Stats Grid */}
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
              <MotionCard
                bg="surface.800"
                borderColor="surface.700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CardBody>
                  <Stat>
                    <StatLabel color="surface.400" fontSize="xs">Total Connections</StatLabel>
                    <StatNumber color="white" fontSize="2xl">
                      {statusData.stats.totalConnections}
                    </StatNumber>
                    <StatHelpText color="surface.500" fontSize="xs">
                      Monitored databases
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </MotionCard>

              <MotionCard
                bg="surface.800"
                borderColor="surface.700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <CardBody>
                  <Stat>
                    <StatLabel color="surface.400" fontSize="xs">Keep-Alive Active</StatLabel>
                    <StatNumber color="green.400" fontSize="2xl">
                      {statusData.stats.activeKeepAlive}
                    </StatNumber>
                    <StatHelpText color="surface.500" fontSize="xs">
                      Auto-ping enabled
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </MotionCard>

              <MotionCard
                bg="surface.800"
                borderColor="surface.700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardBody>
                  <Stat>
                    <StatLabel color="surface.400" fontSize="xs">Last Ping Success</StatLabel>
                    <StatNumber color="green.400" fontSize="2xl">
                      {statusData.stats.lastPingSuccess}
                    </StatNumber>
                    <StatHelpText color="surface.500" fontSize="xs">
                      Successful pings
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </MotionCard>

              <MotionCard
                bg="surface.800"
                borderColor="surface.700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <CardBody>
                  <Stat>
                    <StatLabel color="surface.400" fontSize="xs">Failed Pings</StatLabel>
                    <StatNumber color={statusData.stats.lastPingFailed > 0 ? 'red.400' : 'surface.300'} fontSize="2xl">
                      {statusData.stats.lastPingFailed}
                    </StatNumber>
                    <StatHelpText color="surface.500" fontSize="xs">
                      Requires attention
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </MotionCard>
            </Grid>

            {/* Schedule Info */}
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Box color="brand.400">
                      <ClockIcon />
                    </Box>
                    <Text fontWeight="semibold" color="white">Ping Schedule</Text>
                  </HStack>
                  
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <Box p={4} bg="surface.900" borderRadius="md">
                      <Text color="surface.400" fontSize="xs" mb={1}>Last Run</Text>
                      <Text color="white" fontWeight="medium">
                        {formatTime(statusData.lastRun)}
                      </Text>
                      <Text color="surface.500" fontSize="xs">
                        {formatRelativeTime(statusData.lastRun)}
                      </Text>
                    </Box>
                    <Box p={4} bg="surface.900" borderRadius="md">
                      <Text color="surface.400" fontSize="xs" mb={1}>Next Scheduled Run</Text>
                      <Text color="white" fontWeight="medium">
                        {statusData.nextRun ? formatTime(statusData.nextRun) : 'Every 6 hours'}
                      </Text>
                      <Text color="surface.500" fontSize="xs">
                        Via Vercel Cron
                      </Text>
                    </Box>
                  </Grid>
                </VStack>
              </CardBody>
            </Card>

            {/* Recent Pings */}
            {statusData.recentPings.length > 0 && (
              <Card bg="surface.800" borderColor="surface.700">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={3}>
                      <Box color="brand.400">
                        <ActivityIcon />
                      </Box>
                      <Text fontWeight="semibold" color="white">Recent Pings</Text>
                    </HStack>
                    
                    <Box overflowX="auto">
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th color="surface.400" borderColor="surface.700">Database</Th>
                            <Th color="surface.400" borderColor="surface.700">Status</Th>
                            <Th color="surface.400" borderColor="surface.700">Duration</Th>
                            <Th color="surface.400" borderColor="surface.700">Time</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {statusData.recentPings.map((ping, idx) => (
                            <Tr key={`${ping.connectionId}-${idx}`}>
                              <Td borderColor="surface.700">
                                <Text color="white" fontSize="sm">{ping.connectionName}</Text>
                              </Td>
                              <Td borderColor="surface.700">
                                <Badge colorScheme={ping.success ? 'green' : 'red'}>
                                  {ping.success ? 'Success' : 'Failed'}
                                </Badge>
                              </Td>
                              <Td borderColor="surface.700">
                                <Code fontSize="xs" bg="surface.700" color="surface.300">
                                  {ping.duration}ms
                                </Code>
                              </Td>
                              <Td borderColor="surface.700">
                                <Text color="surface.400" fontSize="xs">
                                  {formatRelativeTime(ping.timestamp)}
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Footer Info */}
            <Box textAlign="center" py={4}>
              <Text color="surface.500" fontSize="sm">
                Pulse monitors and keeps your Supabase databases active
              </Text>
              <HStack spacing={4} justify="center" mt={2}>
                <Link href="/">
                  <Text color="brand.400" fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                    Dashboard
                  </Text>
                </Link>
                <Text color="surface.600">•</Text>
                <Link href="/connections">
                  <Text color="brand.400" fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                    Connections
                  </Text>
                </Link>
              </HStack>
            </Box>
          </VStack>
        ) : (
          <Flex justify="center" align="center" minH="400px">
            <Text color="surface.400">Unable to load status data</Text>
          </Flex>
        )}
      </Container>
    </Box>
  );
}

