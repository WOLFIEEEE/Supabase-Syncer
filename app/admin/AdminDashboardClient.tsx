'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Divider,
  Button,
  Spinner,
  Tooltip,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LineChart from '@/components/admin/charts/LineChart';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

// Suparbase Logo
const SuparbaseLogo = () => (
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <path 
      d="M16 2L4 7v9c0 7.5 5.1 14.5 12 16 6.9-1.5 12-8.5 12-16V7L16 2z" 
      fill="url(#heroGrad)"
      stroke="#0d9488"
      strokeWidth="1"
    />
    <path 
      d="M16 8L11 12v4l5 4 5-4v-4L16 8z" 
      fill="rgba(255,255,255,0.9)"
    />
    <path 
      d="M16 10l3 2.5v2.5L16 18l-3-3v-2.5L16 10z" 
      fill="#0d9488"
    />
  </svg>
);

// Icons
const TestIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SyncIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6"/>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M3 22v-6h6"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

const SecurityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const HealthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

interface AdminDashboardProps {
  userStats: {
    totalUsers: number;
    newUsers24h: number;
    newUsers7d: number;
    newUsers30d: number;
    activeUsersNow: number;
    activeUsers24h: number;
  };
  syncStats: {
    totalSyncs: number;
    completedSyncs: number;
    failedSyncs: number;
    runningSyncs: number;
    successRate: number;
    syncs24h: number;
    avgDurationSeconds: number;
  };
  securityStats: {
    eventsBySeverity: { critical: number; high: number; medium: number; low: number };
    failedAuthAttempts: number;
    uniqueThreatIPs: number;
    recentEvents: Array<{ eventType: string; severity: string; count: number; lastOccurrence: string }>;
  };
  liveMetrics: {
    activeUsersCount: number;
    activeSyncsCount: number;
    apiRequestsPerMinute: number;
    errorRate: number;
  };
  systemStatus: {
    api: 'operational' | 'degraded' | 'down';
    database: 'operational' | 'degraded' | 'down';
    queue: 'operational' | 'degraded' | 'down';
    cache: 'operational' | 'degraded' | 'down';
  };
  adminUser: { id: string; email: string };
  requestId: string;
}

export default function AdminDashboardClient({
  userStats,
  syncStats,
  securityStats,
  liveMetrics,
  systemStatus,
  adminUser,
  requestId,
}: AdminDashboardProps) {
  const router = useRouter();
  type ChartDataPoint = { date: string; value: number; label?: string };
  const [analytics, setAnalytics] = useState<{ userGrowth?: { data: ChartDataPoint[] }; syncPerformance?: { data: ChartDataPoint[] } } | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastTestRun, setLastTestRun] = useState<{ passed: number; failed: number; time: string } | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics?days=30');
        const result = await response.json();
        if (result.success) {
          setAnalytics(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    const checkBackend = async () => {
      try {
        // Use frontend API proxy to avoid CORS issues
        const res = await fetch('/api/backend-health', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          setBackendStatus(data.healthy ? 'online' : 'offline');
        } else {
          setBackendStatus('offline');
        }
      } catch {
        setBackendStatus('offline');
      }
    };

    fetchAnalytics();
    checkBackend();
    
    const interval = setInterval(() => {
      fetchAnalytics();
      checkBackend();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate overall health
  const healthScore = [systemStatus.api, systemStatus.database, systemStatus.queue, systemStatus.cache]
    .filter(s => s === 'operational').length;
  const healthPercent = (healthScore / 4) * 100;

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)" position="relative" overflow="hidden">
      {/* Background Gradient */}
      <Box
        position="absolute"
        top="-200px"
        right="-200px"
        w="600px"
        h="600px"
        bg="radial-gradient(circle, rgba(20, 184, 166, 0.08) 0%, transparent 70%)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-100px"
        left="-100px"
        w="400px"
        h="400px"
        bg="radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="7xl" py={8} px={{ base: 4, md: 6 }} position="relative">
        <VStack spacing={8} align="stretch">
          {/* Hero Header */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              bg="linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)"
              borderColor="teal.500/20"
              borderWidth="1px"
              overflow="hidden"
              position="relative"
            >
              <CardBody py={8}>
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8} alignItems="center">
                  <VStack align="start" spacing={4}>
                    <HStack spacing={4}>
                      <SuparbaseLogo />
                      <VStack align="start" spacing={0}>
                        <Heading
                          size="2xl"
                          bgGradient="linear(to-r, teal.400, cyan.400)"
                          bgClip="text"
                          fontFamily="'Outfit', sans-serif"
                          letterSpacing="-0.03em"
                        >
                          Suparbase
                        </Heading>
                        <Text color="surface.400" fontSize="sm">Admin Control Center</Text>
                      </VStack>
                    </HStack>
                    <HStack spacing={3} flexWrap="wrap">
                      <Badge 
                        bg="rgba(239, 68, 68, 0.2)" 
                        color="red.400" 
                        px={3} 
                        py={1} 
                        borderRadius="full"
                        border="1px solid"
                        borderColor="red.500/30"
                      >
                ADMIN ACCESS
              </Badge>
                      <Badge 
                        bg="rgba(34, 197, 94, 0.2)" 
                        color="green.400" 
                        px={3} 
                        py={1} 
                        borderRadius="full"
                        border="1px solid"
                        borderColor="green.500/30"
                      >
                VERIFIED
              </Badge>
                      <Badge 
                        bg={backendStatus === 'online' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
                        color={backendStatus === 'online' ? 'green.400' : 'red.400'}
                        px={3} 
                        py={1} 
                        borderRadius="full"
                        border="1px solid"
                        borderColor={backendStatus === 'online' ? 'green.500/30' : 'red.500/30'}
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        {backendStatus === 'checking' ? <Spinner size="xs" /> : null}
                        Backend {backendStatus === 'checking' ? '...' : backendStatus.toUpperCase()}
                      </Badge>
            </HStack>
                    <Text color="surface.300" fontSize="sm">
                      Logged in as <Text as="span" color="teal.400" fontWeight="600">{adminUser.email}</Text>
                  </Text>
                </VStack>

                  {/* Quick Actions */}
                  <VStack align={{ base: 'start', lg: 'end' }} spacing={3}>
                    <Text color="surface.400" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                      Quick Actions
                    </Text>
                    <HStack spacing={3} flexWrap="wrap">
                      <Button
                        size="sm"
                        leftIcon={<TestIcon />}
                        bg="linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)"
                        color="white"
                        _hover={{ opacity: 0.9, transform: 'translateY(-1px)' }}
                        transition="all 0.2s"
                        onClick={() => router.push('/admin/api-testing')}
                      >
                        Run API Tests
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<UsersIcon />}
                        variant="outline"
                        borderColor="surface.600"
                        color="surface.300"
                        _hover={{ bg: 'surface.800', borderColor: 'surface.500' }}
                        onClick={() => router.push('/admin/users')}
                      >
                        View Users
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<SecurityIcon />}
                        variant="outline"
                        borderColor="surface.600"
                        color="surface.300"
                        _hover={{ bg: 'surface.800', borderColor: 'surface.500' }}
                        onClick={() => router.push('/admin/security')}
                      >
                        Security
                      </Button>
                    </HStack>
                  </VStack>
                </Grid>
              </CardBody>
            </Card>
          </MotionBox>

          {/* System Health Overview */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <HStack justify="space-between" mb={4}>
              <Heading as="h2" size="lg" color="white" fontFamily="'Outfit', sans-serif">
                System Health
              </Heading>
              <Badge 
                colorScheme={healthPercent === 100 ? 'green' : healthPercent >= 75 ? 'yellow' : 'red'} 
                fontSize="sm" 
                px={3} 
                py={1}
              >
                {healthPercent}% Healthy
              </Badge>
            </HStack>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <SystemStatusCard label="API" status={systemStatus.api} />
              <SystemStatusCard label="Database" status={systemStatus.database} />
              <SystemStatusCard label="Queue" status={systemStatus.queue} />
              <SystemStatusCard label="Cache" status={systemStatus.cache} />
            </SimpleGrid>
          </MotionBox>

          {/* Real-Time Metrics */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Heading as="h2" size="lg" mb={4} color="white" fontFamily="'Outfit', sans-serif">
              Real-Time Metrics
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <MetricCard
                title="Active Users"
                value={liveMetrics.activeUsersCount}
                icon={<UsersIcon />}
                color="teal"
              />
              <MetricCard
                title="Active Syncs"
                value={liveMetrics.activeSyncsCount}
                icon={<SyncIcon />}
                color="cyan"
              />
              <MetricCard
                title="Requests/Min"
                value={liveMetrics.apiRequestsPerMinute.toFixed(1)}
                icon={<HealthIcon />}
                color="blue"
              />
              <MetricCard
                title="Error Rate"
                value={`${liveMetrics.errorRate.toFixed(1)}%`}
                icon={<SecurityIcon />}
                color={liveMetrics.errorRate > 10 ? 'red' : liveMetrics.errorRate > 5 ? 'yellow' : 'green'}
              />
            </SimpleGrid>
          </MotionBox>

          {/* Stats Grid */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
          {/* User Statistics */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
                <CardBody>
                  <HStack justify="space-between" mb={4}>
                    <HStack spacing={2}>
                      <UsersIcon />
                      <Heading size="md" color="white">User Statistics</Heading>
                    </HStack>
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      color="teal.400" 
                      rightIcon={<ArrowRightIcon />}
                      onClick={() => router.push('/admin/users')}
                    >
                      View All
                    </Button>
                  </HStack>
                  <SimpleGrid columns={2} spacing={4}>
                    <StatItem label="Total Users" value={userStats.totalUsers} />
                    <StatItem label="Active Now" value={userStats.activeUsersNow} highlight />
                    <StatItem label="New (24h)" value={userStats.newUsers24h} />
                    <StatItem label="New (7d)" value={userStats.newUsers7d} />
                    <StatItem label="New (30d)" value={userStats.newUsers30d} />
                    <StatItem label="Active (24h)" value={userStats.activeUsers24h} />
            </SimpleGrid>
                </CardBody>
              </Card>
            </MotionBox>

          {/* Sync Statistics */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
                <CardBody>
                  <HStack justify="space-between" mb={4}>
                    <HStack spacing={2}>
                      <SyncIcon />
                      <Heading size="md" color="white">Sync Statistics</Heading>
                    </HStack>
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      color="teal.400" 
                      rightIcon={<ArrowRightIcon />}
                      onClick={() => router.push('/admin/sync-jobs')}
                    >
                      View All
                    </Button>
                  </HStack>
                  <SimpleGrid columns={2} spacing={4}>
                    <StatItem label="Total Syncs" value={syncStats.totalSyncs} />
                    <StatItem 
                      label="Success Rate" 
                value={`${syncStats.successRate.toFixed(1)}%`}
                      color={syncStats.successRate >= 90 ? 'green' : syncStats.successRate >= 70 ? 'yellow' : 'red'}
              />
                    <StatItem label="Completed" value={syncStats.completedSyncs} color="green" />
                    <StatItem label="Failed" value={syncStats.failedSyncs} color="red" />
                    <StatItem label="Running" value={syncStats.runningSyncs} highlight />
                    <StatItem label="Avg Duration" value={`${syncStats.avgDurationSeconds.toFixed(1)}s`} />
            </SimpleGrid>
                </CardBody>
              </Card>
            </MotionBox>
          </Grid>

          {/* Security Overview */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <HStack spacing={2}>
                    <SecurityIcon />
                    <Heading size="md" color="white">Security Overview (24h)</Heading>
                  </HStack>
                  <Button 
                    size="xs" 
                    variant="ghost" 
                    color="teal.400" 
                    rightIcon={<ArrowRightIcon />}
                    onClick={() => router.push('/admin/security')}
                  >
                    View Details
                  </Button>
                </HStack>
                <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
                  <StatItem 
                    label="Critical" 
                value={securityStats.eventsBySeverity.critical}
                color={securityStats.eventsBySeverity.critical > 0 ? 'red' : 'gray'}
              />
                  <StatItem 
                    label="High" 
                value={securityStats.eventsBySeverity.high}
                color={securityStats.eventsBySeverity.high > 0 ? 'orange' : 'gray'}
              />
                  <StatItem label="Medium" value={securityStats.eventsBySeverity.medium} />
                  <StatItem label="Low" value={securityStats.eventsBySeverity.low} />
                  <StatItem label="Failed Auth" value={securityStats.failedAuthAttempts} />
                  <StatItem label="Threat IPs" value={securityStats.uniqueThreatIPs} />
            </SimpleGrid>
              </CardBody>
            </Card>
          </MotionBox>

          {/* Recent Security Events */}
          {securityStats.recentEvents.length > 0 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Heading as="h2" size="lg" mb={4} color="white" fontFamily="'Outfit', sans-serif">
                Recent Security Events
              </Heading>
              <Card bg="surface.800" borderColor="surface.700" borderWidth="1px" overflow="hidden">
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg="surface.700/50">
                      <Tr>
                        <Th color="surface.300" borderColor="surface.600">Event Type</Th>
                        <Th color="surface.300" borderColor="surface.600">Severity</Th>
                        <Th color="surface.300" borderColor="surface.600" isNumeric>Count</Th>
                        <Th color="surface.300" borderColor="surface.600">Last Occurrence</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {securityStats.recentEvents.slice(0, 5).map((event, index) => (
                        <Tr key={index} _hover={{ bg: 'surface.700/30' }}>
                          <Td color="white" borderColor="surface.700" textTransform="capitalize">
                            {event.eventType.replace(/_/g, ' ')}
                          </Td>
                          <Td borderColor="surface.700">
                            <SeverityBadge severity={event.severity} />
                          </Td>
                          <Td color="white" borderColor="surface.700" isNumeric fontWeight="600">
                            {event.count}
                          </Td>
                          <Td color="surface.400" borderColor="surface.700" fontSize="sm">
                            {new Date(event.lastOccurrence).toLocaleString()}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Card>
            </MotionBox>
          )}

          {/* Analytics Charts */}
          {analytics && (
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
              {analytics.userGrowth && (
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
                    <CardBody>
                      <Heading size="md" color="white" mb={4}>User Growth Trend</Heading>
                      <LineChart data={analytics.userGrowth.data} color="#14b8a6" height={250} />
                    </CardBody>
                  </Card>
                </MotionBox>
              )}

              {analytics.syncPerformance && (
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
                    <CardBody>
                      <Heading size="md" color="white" mb={4}>Sync Performance</Heading>
                      <LineChart data={analytics.syncPerformance.data} color="#06b6d4" height={250} />
                    </CardBody>
                  </Card>
                </MotionBox>
              )}
            </Grid>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

// Component: System Status Card
function SystemStatusCard({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' }) {
  const config = {
    operational: { color: 'green.400', bg: 'rgba(34, 197, 94, 0.1)', border: 'green.500/30', text: 'Operational' },
    degraded: { color: 'yellow.400', bg: 'rgba(234, 179, 8, 0.1)', border: 'yellow.500/30', text: 'Degraded' },
    down: { color: 'red.400', bg: 'rgba(239, 68, 68, 0.1)', border: 'red.500/30', text: 'Down' },
  };
  const c = config[status];

  return (
    <Card bg={c.bg} borderColor={c.border} borderWidth="1px">
      <CardBody py={4}>
        <VStack spacing={2}>
          <HStack spacing={2}>
            <Box w={2.5} h={2.5} borderRadius="full" bg={c.color} boxShadow={`0 0 8px ${c.color}`} />
            <Text color={c.color} fontWeight="600" fontSize="sm">{c.text}</Text>
          </HStack>
          <Text color="white" fontWeight="500">{label}</Text>
        </VStack>
      </CardBody>
    </Card>
  );
}

// Component: Metric Card
function MetricCard({ 
  title,
  value,
  icon, 
  color 
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; border: string; accent: string }> = {
    teal: { bg: 'rgba(20, 184, 166, 0.1)', border: 'teal.500/30', accent: 'teal.400' },
    cyan: { bg: 'rgba(6, 182, 212, 0.1)', border: 'cyan.500/30', accent: 'cyan.400' },
    blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'blue.500/30', accent: 'blue.400' },
    green: { bg: 'rgba(34, 197, 94, 0.1)', border: 'green.500/30', accent: 'green.400' },
    yellow: { bg: 'rgba(234, 179, 8, 0.1)', border: 'yellow.500/30', accent: 'yellow.400' },
    red: { bg: 'rgba(239, 68, 68, 0.1)', border: 'red.500/30', accent: 'red.400' },
  };
  const c = colorMap[color] || colorMap.teal;

  return (
    <Card 
      bg="surface.800" 
      borderColor="surface.700" 
      borderWidth="1px" 
      _hover={{ borderColor: c.border, transform: 'translateY(-2px)' }} 
      transition="all 0.2s"
    >
      <CardBody>
        <HStack justify="space-between" mb={3}>
          <Text fontSize="sm" color="surface.400">{title}</Text>
          <Box color={c.accent} opacity={0.7}>{icon}</Box>
        </HStack>
        <Heading as="h3" size="xl" color="white">{value}</Heading>
      </CardBody>
    </Card>
  );
}

// Component: Stat Item
function StatItem({ 
  label, 
  value,
  color, 
  highlight 
}: {
  label: string; 
  value: string | number;
  color?: string; 
  highlight?: boolean;
}) {
  const colorMap: Record<string, string> = {
    gray: 'surface.300',
    green: 'green.400',
    red: 'red.400',
    yellow: 'yellow.400',
    orange: 'orange.400',
  };

  return (
    <Box 
      p={3} 
      borderRadius="lg" 
      bg={highlight ? 'rgba(20, 184, 166, 0.1)' : 'surface.700/30'}
      border={highlight ? '1px solid' : 'none'}
      borderColor={highlight ? 'teal.500/30' : 'transparent'}
    >
      <Text fontSize="xs" color="surface.400" mb={1}>{label}</Text>
      <Text fontSize="lg" fontWeight="700" color={color ? colorMap[color] : 'white'}>
        {value}
        </Text>
    </Box>
  );
}

// Component: Severity Badge
function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { colorScheme: string }> = {
    critical: { colorScheme: 'red' },
    high: { colorScheme: 'orange' },
    medium: { colorScheme: 'yellow' },
    low: { colorScheme: 'blue' },
  };

  return (
    <Badge colorScheme={config[severity]?.colorScheme || 'gray'} fontSize="xs" textTransform="capitalize">
      {severity}
    </Badge>
  );
}
