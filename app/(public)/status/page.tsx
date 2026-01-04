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
  Flex,
  Code,
  Divider,
  SimpleGrid,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

// Icons
const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
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
  session: {
    status: 'ok' | 'error';
    message: string;
  };
  connections: {
    total: number;
    production: number;
    development: number;
  };
}

export default function StatusPage() {
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

  return (
    <Box minH="100vh">
      {/* Header */}
      <Box bg="surface.800" borderBottomWidth="1px" borderColor="surface.700">
        <Container maxW="4xl" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Button
                variant="ghost"
                leftIcon={<HomeIcon />}
                onClick={() => router.push('/landing')}
                size="sm"
              >
                Home
              </Button>
              <Heading size="md" color="white" fontFamily="mono">
                System Status
              </Heading>
            </HStack>
            <Button
              leftIcon={<RefreshIcon />}
              onClick={checkStatus}
              isLoading={isLoading}
              size="sm"
              variant="outline"
            >
              Refresh
            </Button>
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" py={8}>
        {isLoading && !status ? (
          <Flex justify="center" py={20}>
            <Spinner size="xl" color="brand.400" />
          </Flex>
        ) : status ? (
          <VStack spacing={6} align="stretch">
            {/* Overall Status */}
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody>
                <HStack spacing={4}>
                  {getStatusIcon(status.application.status)}
                  <VStack align="start" spacing={0} flex={1}>
                    <Heading size="md" color="white">
                      Supabase Syncer
                    </Heading>
                    <Text color="surface.400" fontSize="sm">
                      Version {status.application.version} • Uptime: {status.application.uptime}
                    </Text>
                  </VStack>
                  <Badge 
                    colorScheme={getStatusColor(status.application.status)} 
                    fontSize="md" 
                    px={4} 
                    py={2}
                  >
                    {status.application.status === 'ok' ? 'Operational' : 'Issues Detected'}
                  </Badge>
                </HStack>
              </CardBody>
            </Card>

            {/* Components Status */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {/* Database */}
              <Card bg="surface.800" borderColor="surface.700">
                <CardBody>
                  <HStack spacing={4} mb={3}>
                    {getStatusIcon(status.database.status)}
                    <VStack align="start" spacing={0} flex={1}>
                      <Text color="white" fontWeight="bold">Database</Text>
                      <Badge colorScheme={getStatusColor(status.database.status)} size="sm">
                        {status.database.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </VStack>
                  </HStack>
                  <Text color="surface.400" fontSize="sm">{status.database.message}</Text>
                  {status.database.type && (
                    <Code mt={2} fontSize="xs" bg="surface.700">
                      {status.database.type}
                    </Code>
                  )}
                </CardBody>
              </Card>

              {/* Redis */}
              <Card bg="surface.800" borderColor="surface.700">
                <CardBody>
                  <HStack spacing={4} mb={3}>
                    {getStatusIcon(status.redis.status)}
                    <VStack align="start" spacing={0} flex={1}>
                      <Text color="white" fontWeight="bold">Redis Queue</Text>
                      <Badge colorScheme={getStatusColor(status.redis.status)} size="sm">
                        {status.redis.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </VStack>
                  </HStack>
                  <Text color="surface.400" fontSize="sm">{status.redis.message}</Text>
                </CardBody>
              </Card>

              {/* Encryption */}
              <Card bg="surface.800" borderColor="surface.700">
                <CardBody>
                  <HStack spacing={4} mb={3}>
                    {getStatusIcon(status.encryption.status)}
                    <VStack align="start" spacing={0} flex={1}>
                      <Text color="white" fontWeight="bold">Encryption</Text>
                      <Badge colorScheme={getStatusColor(status.encryption.status)} size="sm">
                        {status.encryption.status.toUpperCase()}
                      </Badge>
                    </VStack>
                  </HStack>
                  <Text color="surface.400" fontSize="sm">{status.encryption.message}</Text>
                </CardBody>
              </Card>

              {/* Session */}
              <Card bg="surface.800" borderColor="surface.700">
                <CardBody>
                  <HStack spacing={4} mb={3}>
                    {getStatusIcon(status.session.status)}
                    <VStack align="start" spacing={0} flex={1}>
                      <Text color="white" fontWeight="bold">Session Security</Text>
                      <Badge colorScheme={getStatusColor(status.session.status)} size="sm">
                        {status.session.status.toUpperCase()}
                      </Badge>
                    </VStack>
                  </HStack>
                  <Text color="surface.400" fontSize="sm">{status.session.message}</Text>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Connections Summary */}
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody>
                <Heading size="sm" color="white" mb={4}>Configured Connections</Heading>
                <SimpleGrid columns={3} spacing={4}>
                  <VStack>
                    <Text fontSize="3xl" fontWeight="bold" color="white">
                      {status.connections.total}
                    </Text>
                    <Text color="surface.400" fontSize="sm">Total</Text>
                  </VStack>
                  <VStack>
                    <Text fontSize="3xl" fontWeight="bold" color="red.400">
                      {status.connections.production}
                    </Text>
                    <Text color="surface.400" fontSize="sm">Production</Text>
                  </VStack>
                  <VStack>
                    <Text fontSize="3xl" fontWeight="bold" color="green.400">
                      {status.connections.development}
                    </Text>
                    <Text color="surface.400" fontSize="sm">Development</Text>
                  </VStack>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Recommendations */}
            {(status.database.status === 'not_configured' || status.redis.status === 'not_configured') && (
              <Alert status="info" borderRadius="md" bg="blue.900" borderColor="blue.700">
                <AlertIcon color="blue.300" />
                <VStack align="start" spacing={2}>
                  <Text color="white" fontWeight="bold">Optional Enhancements Available</Text>
                  <VStack align="start" spacing={1} fontSize="sm" color="blue.200">
                    {status.database.status === 'not_configured' && (
                      <Text>
                        • Add <Code bg="blue.800">DATABASE_URL</Code> for persistent storage (connections won't be lost on restart)
                      </Text>
                    )}
                    {status.redis.status === 'not_configured' && (
                      <Text>
                        • Add <Code bg="blue.800">REDIS_URL</Code> for background job processing (non-blocking syncs)
                      </Text>
                    )}
                  </VStack>
                </VStack>
              </Alert>
            )}

            {/* Last Checked */}
            {lastChecked && (
              <Text color="surface.500" fontSize="sm" textAlign="center">
                Last checked: {lastChecked.toLocaleTimeString()}
              </Text>
            )}
          </VStack>
        ) : (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text>Failed to load system status. Please try again.</Text>
          </Alert>
        )}
      </Container>
    </Box>
  );
}

