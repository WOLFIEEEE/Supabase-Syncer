'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Code,
  Badge,
  Icon,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { DatabaseIcon } from '@/components/docs/DocsIcons';

export default function DatabaseDocsPage() {
  const tables = [
    {
      name: 'connections',
      description: 'Stores encrypted database connection strings.',
      color: 'blue',
      schema: `CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  encrypted_url TEXT NOT NULL,
  environment VARCHAR(20) NOT NULL,
  keep_alive BOOLEAN DEFAULT false NOT NULL,
  last_pinged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
    },
    {
      name: 'sync_jobs',
      description: 'Tracks synchronization jobs and their status.',
      color: 'green',
      schema: `CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_connection_id UUID NOT NULL REFERENCES connections(id),
  target_connection_id UUID NOT NULL REFERENCES connections(id),
  direction VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  tables_config JSONB NOT NULL DEFAULT '[]',
  progress JSONB,
  checkpoint JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    },
    {
      name: 'sync_logs',
      description: 'Stores detailed logs for each sync job.',
      color: 'purple',
      schema: `CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_job_id UUID NOT NULL REFERENCES sync_jobs(id),
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    },
  ];

  const loggingTables = [
    { name: 'security_events', desc: 'Stores security-related events (auth failures, permission denials, etc.)' },
    { name: 'security_alerts', desc: 'Stores security alerts that need attention' },
    { name: 'ping_logs', desc: 'Stores keep-alive ping history' },
    { name: 'user_sessions', desc: 'Tracks user sessions for security' },
  ];

  const usageTables = [
    { name: 'usage_limits', desc: 'Stores user usage limits and current usage' },
    { name: 'usage_history', desc: 'Historical usage data for analytics' },
  ];

  return (
    <Box minH="100vh">
      <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Icon as={DatabaseIcon} w={8} h={8} color="purple.400" />
              <Badge colorScheme="purple" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
                DATABASE SCHEMA
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
              Database Schema
            </Heading>
            <Text fontSize="lg" color="surface.400" lineHeight="1.6">
              PostgreSQL schema documentation for Supabase Syncer. All tables use Row Level Security (RLS).
            </Text>
          </VStack>

          {/* Overview */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Overview
              </Heading>
              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                Supabase Syncer uses PostgreSQL (via Supabase) to store all application data. All tables use Row Level Security (RLS) to ensure users can only access their own data.
              </Text>
            </CardBody>
          </Card>

          {/* Core Tables */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Core Tables
              </Heading>
              <VStack spacing={6} align="stretch">
                {tables.map((table, index) => (
                  <Box key={table.name}>
                    <Box borderLeft="4px" borderLeftColor={`${table.color}.500`} pl={4}>
                      <HStack spacing={2} mb={2}>
                        <Heading as="h3" size="sm" color="white" fontWeight="600">
                          {table.name}
                        </Heading>
                        <Badge colorScheme={table.color} fontSize="xs">
                          {table.color}
                        </Badge>
                      </HStack>
                      <Text color="surface.300" fontSize="sm" mb={3} lineHeight="1.6">
                        {table.description}
                      </Text>
                      <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                        <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                          {table.schema}
                        </Code>
                      </Box>
                    </Box>
                    {index < tables.length - 1 && <Divider borderColor="surface.700" mt={6} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Logging Tables */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Logging Tables
              </Heading>
              <VStack spacing={3} align="stretch">
                {loggingTables.map((table) => (
                  <Box key={table.name}>
                    <HStack spacing={3}>
                      <Code colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                        {table.name}
                      </Code>
                      <Text fontSize="sm" color="surface.400">
                        {table.desc}
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Usage Tracking */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Usage Tracking
              </Heading>
              <VStack spacing={3} align="stretch">
                {usageTables.map((table) => (
                  <Box key={table.name}>
                    <HStack spacing={3}>
                      <Code colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                        {table.name}
                      </Code>
                      <Text fontSize="sm" color="surface.400">
                        {table.desc}
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Migrations */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Migrations
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                Database migrations are located in <Code fontSize="xs" colorScheme="blue">supabase/migrations/</Code>. Run them in order using the Supabase SQL Editor.
              </Text>
              <Alert status="warning" bg="yellow.500/10" borderColor="yellow.500/30" borderWidth="1px" borderRadius="md">
                <AlertIcon color="yellow.400" />
                <Text fontSize="sm" color="surface.300">
                  <strong>Important:</strong> Always run migrations in a test environment first and backup your database before applying to production.
                </Text>
              </Alert>
            </CardBody>
          </Card>

          {/* Row Level Security */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Row Level Security (RLS)
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={3} lineHeight="1.6">
                All tables have RLS enabled. Users can only access their own data based on <Code fontSize="xs" colorScheme="blue">user_id</Code> matching <Code fontSize="xs" colorScheme="blue">auth.uid()</Code>.
              </Text>
              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                Admin operations use the service role key which bypasses RLS for system operations.
              </Text>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
