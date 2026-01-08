'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Flex,
  Code,
  SimpleGrid,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

// Icons
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const ServerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

interface SystemStatus {
  application: {
    status: 'ok' | 'error';
    version: string;
    uptime: string;
  };
  database: {
    status: 'connected' | 'not_configured' | 'error';
    message: string;
    type: string;
  };
  redis: {
    status: 'connected' | 'not_configured' | 'error';
    message: string;
  };
  encryption: {
    status: 'ok' | 'error';
    message: string;
  };
  auth: {
    status: 'ok' | 'error';
    message: string;
  };
  connections: {
    total: number;
    production: number;
    development: number;
  };
  keepAlive?: {
    active: number;
    schedule: string;
  };
}

export default function StatusPageClient() {
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'ok':
      case 'connected':
        return <Box color="green.400"><CheckCircleIcon /></Box>;
      case 'not_configured':
        return <Box color="yellow.400"><AlertCircleIcon /></Box>;
      default:
        return <Box color="red.400"><XCircleIcon /></Box>;
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'ok':
      case 'connected':
        return 'green';
      case 'not_configured':
        return 'yellow';
      default:
        return 'red';
    }
  };

  const isAllOperational = status &&
    status.application.status === 'ok' &&
    (status.database.status === 'connected' || status.database.status === 'not_configured') &&
    (status.redis.status === 'connected' || status.redis.status === 'not_configured') &&
    status.encryption.status === 'ok' &&
    status.auth.status === 'ok';

  // Structured Data (JSON-LD)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'suparbase',
    url: 'https://suparbase.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://suparbase.com/status',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Box minH="100vh" w="100%" bg="#0a0a0a">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Header */}
      <Box
        bg="#111"
        borderBottomWidth="1px"
        borderColor="#222"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="7xl" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={6}>
              <Button
                variant="ghost"
                leftIcon={<HomeIcon />}
                onClick={() => router.push('/')}
                size="sm"
                color="gray.400"
                _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
              >
                Home
              </Button>
              <HStack spacing={3}>
                <Box width="24px" height="24px" position="relative">
                  <Image
                    src="/logo.png"
                    alt="suparbase"
                    width={24}
                    height={24}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    priority
                  />
                </Box>
                <Heading as="h1" size="sm" color="white" fontWeight="600">
                  System Status
                </Heading>
              </HStack>
            </HStack>
            <Button
              leftIcon={<RefreshIcon />}
              onClick={checkStatus}
              isLoading={isLoading}
              size="sm"
              variant="outline"
              borderColor="#333"
              color="gray.300"
              _hover={{ bg: 'whiteAlpha.100', borderColor: '#444' }}
            >
              Refresh
            </Button>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" py={10} px={{ base: 4, md: 6 }}>
        {isLoading && !status ? (
          <Flex justify="center" align="center" minH="400px">
            <VStack spacing={4}>
              <Spinner size="lg" color="green.400" thickness="3px" />
              <Text color="gray.500" fontSize="sm">Loading status...</Text>
            </VStack>
          </Flex>
        ) : status ? (
          <VStack spacing={8} align="stretch">
            {/* Overall Status Banner */}
            <Card
              bg={isAllOperational ? "rgba(34, 197, 94, 0.08)" : "rgba(234, 179, 8, 0.08)"}
              borderWidth="1px"
              borderColor={isAllOperational ? "green.800" : "yellow.800"}
              borderRadius="xl"
            >
              <CardBody py={8}>
                <VStack spacing={4}>
                  <HStack spacing={3}>
                    <Box
                      w="12px"
                      h="12px"
                      borderRadius="full"
                      bg={isAllOperational ? "green.400" : "yellow.400"}
                      boxShadow={isAllOperational ? "0 0 12px rgba(34, 197, 94, 0.6)" : "0 0 12px rgba(234, 179, 8, 0.6)"}
                    />
                    <Heading as="h2" size="lg" color="white" fontWeight="600">
                      {isAllOperational ? 'All Systems Operational' : 'Partial System Degradation'}
                    </Heading>
                  </HStack>
                  <HStack spacing={6} color="gray.400" fontSize="sm" divider={<Box w="1px" h="14px" bg="gray.700" />}>
                    <Text>Version {status.application.version}</Text>
                    <Text>Uptime: {status.application.uptime}</Text>
                    {lastChecked && (
                      <Text>Last checked: {lastChecked.toLocaleTimeString()}</Text>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Services Grid */}
            <Box>
              <Text color="gray.400" fontSize="sm" fontWeight="500" mb={4} textTransform="uppercase" letterSpacing="0.05em">
                Core Services
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                {/* Database */}
                <Card bg="#111" borderWidth="1px" borderColor="#222" borderRadius="lg">
                  <CardBody>
                    <HStack justify="space-between" mb={4}>
                      <HStack spacing={3}>
                        <Box color="gray.500"><DatabaseIcon /></Box>
                        <Text color="white" fontWeight="500">Database</Text>
                      </HStack>
                      {getStatusIcon(status.database.status)}
                    </HStack>
                    <VStack align="start" spacing={2}>
                      <Badge
                        colorScheme={getStatusColor(status.database.status)}
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        {status.database.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Text color="gray.500" fontSize="xs" lineHeight="tall">
                        {status.database.message}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Redis */}
                <Card bg="#111" borderWidth="1px" borderColor="#222" borderRadius="lg">
                  <CardBody>
                    <HStack justify="space-between" mb={4}>
                      <HStack spacing={3}>
                        <Box color="gray.500"><ServerIcon /></Box>
                        <Text color="white" fontWeight="500">Redis Queue</Text>
                      </HStack>
                      {getStatusIcon(status.redis.status)}
                    </HStack>
                    <VStack align="start" spacing={2}>
                      <Badge
                        colorScheme={getStatusColor(status.redis.status)}
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        {status.redis.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Text color="gray.500" fontSize="xs" lineHeight="tall">
                        {status.redis.message}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Encryption */}
                <Card bg="#111" borderWidth="1px" borderColor="#222" borderRadius="lg">
                  <CardBody>
                    <HStack justify="space-between" mb={4}>
                      <HStack spacing={3}>
                        <Box color="gray.500"><ShieldIcon /></Box>
                        <Text color="white" fontWeight="500">Encryption</Text>
                      </HStack>
                      {getStatusIcon(status.encryption.status)}
                    </HStack>
                    <VStack align="start" spacing={2}>
                      <Badge
                        colorScheme={getStatusColor(status.encryption.status)}
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        {status.encryption.status.toUpperCase()}
                      </Badge>
                      <Text color="gray.500" fontSize="xs" lineHeight="tall">
                        {status.encryption.message}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Authentication */}
                <Card bg="#111" borderWidth="1px" borderColor="#222" borderRadius="lg">
                  <CardBody>
                    <HStack justify="space-between" mb={4}>
                      <HStack spacing={3}>
                        <Box color="gray.500"><KeyIcon /></Box>
                        <Text color="white" fontWeight="500">Authentication</Text>
                      </HStack>
                      {getStatusIcon(status.auth.status)}
                    </HStack>
                    <VStack align="start" spacing={2}>
                      <Badge
                        colorScheme={getStatusColor(status.auth.status)}
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        {status.auth.status.toUpperCase()}
                      </Badge>
                      <Text color="gray.500" fontSize="xs" lineHeight="tall">
                        {status.auth.message}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Metrics */}
            <Box>
              <Text color="gray.400" fontSize="sm" fontWeight="500" mb={4} textTransform="uppercase" letterSpacing="0.05em">
                Connections
              </Text>
              <Card bg="#111" borderWidth="1px" borderColor="#222" borderRadius="lg">
                <CardBody>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                    <VStack align="start" spacing={1}>
                      <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="0.05em">
                        Total
                      </Text>
                      <Text color="white" fontSize="3xl" fontWeight="600">
                        {status.connections.total}
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={1}>
                      <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="0.05em">
                        Production
                      </Text>
                      <Text color="red.400" fontSize="3xl" fontWeight="600">
                        {status.connections.production}
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={1}>
                      <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="0.05em">
                        Development
                      </Text>
                      <Text color="green.400" fontSize="3xl" fontWeight="600">
                        {status.connections.development}
                      </Text>
                    </VStack>
                    {status.keepAlive && (
                      <VStack align="start" spacing={1}>
                        <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="0.05em">
                          Keep-Alive
                        </Text>
                        <Text color="teal.400" fontSize="3xl" fontWeight="600">
                          {status.keepAlive.active}
                        </Text>
                      </VStack>
                    )}
                  </SimpleGrid>
                </CardBody>
              </Card>
            </Box>

            {/* Keep-Alive Service */}
            {status.keepAlive && status.keepAlive.active > 0 && (
              <Card bg="#111" borderWidth="1px" borderColor="teal.800" borderRadius="lg">
                <CardBody>
                  <HStack justify="space-between">
                    <HStack spacing={4}>
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg="teal.400"
                        boxShadow="0 0 8px rgba(45, 212, 191, 0.6)"
                      />
                      <VStack align="start" spacing={0}>
                        <Text color="white" fontWeight="500">Keep-Alive Service</Text>
                        <Text color="gray.500" fontSize="sm">
                          {status.keepAlive.active} database(s) active | {status.keepAlive.schedule}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge colorScheme="teal" variant="subtle" px={3} py={1} borderRadius="md">
                      Running
                    </Badge>
                  </HStack>
                </CardBody>
              </Card>
            )}

            {/* Sync Engine Features */}
            <Box>
              <Text color="gray.400" fontSize="sm" fontWeight="500" mb={4} textTransform="uppercase" letterSpacing="0.05em">
                Sync Engine
              </Text>
              <Card bg="#111" borderWidth="1px" borderColor="#222" borderRadius="lg">
                <CardBody>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    {[
                      { label: 'Parallel Processing', status: 'Enabled' },
                      { label: 'Auto Rollback', status: 'Enabled' },
                      { label: 'Rate Limiting', status: 'Active' },
                      { label: 'Metrics', status: 'Available' },
                    ].map((feature) => (
                      <HStack key={feature.label} spacing={3}>
                        <Box color="green.400"><CheckCircleIcon /></Box>
                        <VStack align="start" spacing={0}>
                          <Text color="white" fontSize="sm" fontWeight="500">{feature.label}</Text>
                          <Text color="gray.500" fontSize="xs">{feature.status}</Text>
                        </VStack>
                      </HStack>
                    ))}
                  </SimpleGrid>
                </CardBody>
              </Card>
            </Box>

            {/* Backup System */}
            <Card bg="#111" borderWidth="1px" borderColor="#222" borderRadius="lg">
              <CardBody>
                <HStack justify="space-between">
                  <HStack spacing={4}>
                    <Box color="green.400"><CheckCircleIcon /></Box>
                    <VStack align="start" spacing={0}>
                      <Text color="white" fontWeight="500">Automatic Backup Snapshots</Text>
                      <Text color="gray.500" fontSize="sm">
                        Backups created before every sync with 7-day retention
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="md">
                    Operational
                  </Badge>
                </HStack>
              </CardBody>
            </Card>

            {/* Configuration Recommendations */}
            {(status.database.status === 'not_configured' || status.redis.status === 'not_configured') && (
              <Alert
                status="info"
                borderRadius="lg"
                bg="rgba(59, 130, 246, 0.08)"
                borderWidth="1px"
                borderColor="blue.800"
              >
                <AlertIcon color="blue.400" />
                <VStack align="start" spacing={2} ml={2}>
                  <Text color="white" fontWeight="500">Optional Configuration</Text>
                  <VStack align="start" spacing={1} fontSize="sm" color="gray.400">
                    {status.database.status === 'not_configured' && (
                      <HStack>
                        <Code bg="blue.900" color="blue.200" px={2} py={0.5} borderRadius="md" fontSize="xs">
                          DATABASE_URL
                        </Code>
                        <Text>Enable persistent storage</Text>
                      </HStack>
                    )}
                    {status.redis.status === 'not_configured' && (
                      <HStack>
                        <Code bg="blue.900" color="blue.200" px={2} py={0.5} borderRadius="md" fontSize="xs">
                          REDIS_URL
                        </Code>
                        <Text>Enable background job processing</Text>
                      </HStack>
                    )}
                  </VStack>
                </VStack>
              </Alert>
            )}
          </VStack>
        ) : (
          <Flex justify="center" align="center" minH="400px">
            <VStack spacing={4}>
              <Alert status="error" borderRadius="lg" maxW="md">
                <AlertIcon />
                <Text>Failed to load system status. Please try again.</Text>
              </Alert>
              <Button
                leftIcon={<RefreshIcon />}
                onClick={checkStatus}
                size="sm"
                colorScheme="red"
                variant="outline"
              >
                Retry
              </Button>
            </VStack>
          </Flex>
        )}
      </Container>
    </Box>
  );
}
