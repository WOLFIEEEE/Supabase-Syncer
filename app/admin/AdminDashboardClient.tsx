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
} from '@chakra-ui/react';

interface AdminDashboardProps {
  userStats: any;
  syncStats: any;
  securityStats: any;
  liveMetrics: any;
  systemStatus: any;
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
  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="7xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={4} align="center">
              <Badge colorScheme="red" px={3} py={1} borderRadius="full" fontSize="sm">
                ADMIN ACCESS
              </Badge>
              <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="sm">
                VERIFIED
              </Badge>
            </HStack>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="700"
              color="white"
              fontFamily="'Outfit', sans-serif"
              letterSpacing="-0.02em"
            >
              Admin <Text as="span" color="teal.400">Dashboard</Text>
            </Heading>
            <Text color="surface.400" fontSize="md" maxW="3xl">
              Comprehensive monitoring and analytics for Supabase Syncer
            </Text>
            <Card bg="surface.800" borderColor="brand.400/20" borderWidth="1px" mt={4}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color="white" fontWeight="medium">
                    Logged in as: <Text as="span" color="brand.400">{adminUser.email}</Text>
                  </Text>
                  <Text fontSize="xs" color="surface.400">
                    Admin access verified • Request ID: {requestId}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Real-Time Metrics */}
          <Box>
            <Heading as="h2" size="lg" mb={4} color="white">
              Real-Time Metrics
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <StatCard
                title="Active Users"
                value={liveMetrics.activeUsersCount}
                status={systemStatus.api}
              />
              <StatCard
                title="Active Syncs"
                value={liveMetrics.activeSyncsCount}
                status={systemStatus.database}
              />
              <StatCard
                title="Requests/Min"
                value={liveMetrics.apiRequestsPerMinute.toFixed(1)}
                status="operational"
              />
              <StatCard
                title="Error Rate"
                value={`${liveMetrics.errorRate.toFixed(1)}%`}
                status={liveMetrics.errorRate > 10 ? 'degraded' : 'operational'}
              />
            </SimpleGrid>
          </Box>

          {/* User Statistics */}
          <Box>
            <Heading as="h2" size="lg" mb={4} color="white">
              User Statistics
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <InfoCard title="Total Users" value={userStats.totalUsers} />
              <InfoCard title="New Users (24h)" value={userStats.newUsers24h} />
              <InfoCard title="Active Now" value={userStats.activeUsersNow} />
              <InfoCard title="New Users (7d)" value={userStats.newUsers7d} />
              <InfoCard title="New Users (30d)" value={userStats.newUsers30d} />
              <InfoCard title="Active (24h)" value={userStats.activeUsers24h} />
            </SimpleGrid>
          </Box>

          {/* Sync Statistics */}
          <Box>
            <Heading as="h2" size="lg" mb={4} color="white">
              Sync Job Statistics
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <InfoCard title="Total Syncs" value={syncStats.totalSyncs} />
              <InfoCard title="Completed" value={syncStats.completedSyncs} color="green" />
              <InfoCard title="Failed" value={syncStats.failedSyncs} color="red" />
              <InfoCard title="Running" value={syncStats.runningSyncs} color="blue" />
              <InfoCard
                title="Success Rate"
                value={`${syncStats.successRate.toFixed(1)}%`}
                color={
                  syncStats.successRate >= 90
                    ? 'green'
                    : syncStats.successRate >= 70
                      ? 'yellow'
                      : 'red'
                }
              />
              <InfoCard title="Syncs (24h)" value={syncStats.syncs24h} />
              <InfoCard title="Avg Duration" value={`${syncStats.avgDurationSeconds.toFixed(1)}s`} />
            </SimpleGrid>
          </Box>

          {/* Security Overview */}
          <Box>
            <Heading as="h2" size="lg" mb={4} color="white">
              Security Overview (24h)
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <InfoCard
                title="Critical Events"
                value={securityStats.eventsBySeverity.critical}
                color={securityStats.eventsBySeverity.critical > 0 ? 'red' : 'gray'}
              />
              <InfoCard
                title="High Severity"
                value={securityStats.eventsBySeverity.high}
                color={securityStats.eventsBySeverity.high > 0 ? 'orange' : 'gray'}
              />
              <InfoCard title="Medium Severity" value={securityStats.eventsBySeverity.medium} />
              <InfoCard title="Low Severity" value={securityStats.eventsBySeverity.low} />
              <InfoCard title="Failed Auth" value={securityStats.failedAuthAttempts} />
              <InfoCard title="Threat IPs" value={securityStats.uniqueThreatIPs} />
            </SimpleGrid>
          </Box>

          {/* Recent Security Events */}
          {securityStats.recentEvents.length > 0 && (
            <Box>
              <Heading as="h2" size="lg" mb={4} color="white">
                Recent Security Events
              </Heading>
              <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
                <CardBody p={0}>
                  <Table variant="simple" colorScheme="whiteAlpha">
                    <Thead>
                      <Tr>
                        <Th color="surface.300">Event Type</Th>
                        <Th color="surface.300">Severity</Th>
                        <Th color="surface.300">Count</Th>
                        <Th color="surface.300">Last Occurrence</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {securityStats.recentEvents.slice(0, 10).map((event: any, index: number) => (
                        <Tr key={index}>
                          <Td color="white">
                            {event.eventType.replace(/_/g, ' ')}
                          </Td>
                          <Td>
                            <SeverityBadge severity={event.severity} />
                          </Td>
                          <Td color="white">{event.count}</Td>
                          <Td color="surface.400">
                            {new Date(event.lastOccurrence).toLocaleString()}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </Box>
          )}

          {/* System Status */}
          <Box>
            <Heading as="h2" size="lg" mb={4} color="white">
              System Status
            </Heading>
            <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <StatusRow label="API" status={systemStatus.api} />
                  <Divider borderColor="surface.700" />
                  <StatusRow label="Database" status={systemStatus.database} />
                  <Divider borderColor="surface.700" />
                  <StatusRow label="Queue" status={systemStatus.queue} />
                  <Divider borderColor="surface.700" />
                  <StatusRow label="Cache" status={systemStatus.cache} />
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

// Component: Stat Card
function StatCard({
  title,
  value,
  status,
}: {
  title: string;
  value: string | number;
  status?: 'operational' | 'degraded' | 'down';
}) {
  const statusColors = {
    operational: { bg: 'green.500', text: 'Operational' },
    degraded: { bg: 'yellow.500', text: 'Degraded' },
    down: { bg: 'red.500', text: 'Down' },
  };

  const statusConfig = statusColors[status || 'operational'];

  return (
    <Card bg="surface.800" borderColor="surface.700" borderWidth="1px" _hover={{ borderColor: 'brand.400/40' }} transition="all 0.2s">
      <CardBody>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" color="surface.400">
            {title}
          </Text>
          {status && (
            <Badge colorScheme={status === 'operational' ? 'green' : status === 'degraded' ? 'yellow' : 'red'} fontSize="xs">
              {statusConfig.text}
            </Badge>
          )}
        </Flex>
        <Heading as="h3" size="xl" color="white">
          {value}
        </Heading>
      </CardBody>
    </Card>
  );
}

// Component: Info Card
function InfoCard({
  title,
  value,
  color = 'gray',
}: {
  title: string;
  value: string | number;
  color?: 'gray' | 'green' | 'red' | 'blue' | 'yellow' | 'orange';
}) {
  const colors = {
    gray: 'white',
    green: 'green.400',
    red: 'red.400',
    blue: 'blue.400',
    yellow: 'yellow.400',
    orange: 'orange.400',
  };

  return (
    <Card bg="surface.800" borderColor="surface.700" borderWidth="1px" _hover={{ borderColor: 'brand.400/40' }} transition="all 0.2s">
      <CardBody>
        <Text fontSize="sm" color="surface.400" mb={2}>
          {title}
        </Text>
        <Heading as="h3" size="lg" color={colors[color]}>
          {value}
        </Heading>
      </CardBody>
    </Card>
  );
}

// Component: Severity Badge
function SeverityBadge({ severity }: { severity: string }) {
  const colorSchemes: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue',
  };

  return (
    <Badge colorScheme={colorSchemes[severity] || 'gray'} fontSize="xs">
      {severity}
    </Badge>
  );
}

// Component: Status Row
function StatusRow({
  label,
  status,
}: {
  label: string;
  status: 'operational' | 'degraded' | 'down';
}) {
  const statusConfig = {
    operational: { color: 'green.500', text: 'Operational' },
    degraded: { color: 'yellow.500', text: 'Degraded' },
    down: { color: 'red.500', text: 'Down' },
  };

  const config = statusConfig[status];

  return (
    <Flex justify="space-between" align="center">
      <Text color="white" fontWeight="medium">
        {label}
      </Text>
      <HStack spacing={2}>
        <Box w={3} h={3} borderRadius="full" bg={config.color} />
        <Text fontSize="sm" color="surface.400">
          {config.text}
        </Text>
      </HStack>
    </Flex>
  );
}

