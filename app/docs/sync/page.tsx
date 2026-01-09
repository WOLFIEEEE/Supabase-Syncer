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
  UnorderedList,
  ListItem,
  OrderedList,
} from '@chakra-ui/react';
import { SyncIcon } from '@/components/docs/DocsIcons';

export default function SyncDocsPage() {
  return (
    <Box minH="100vh">
      <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Icon as={SyncIcon} w={8} h={8} color="teal.400" />
              <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
                SYNC OPERATIONS
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
              Sync Operations
            </Heading>
            <Text fontSize="lg" color="surface.400" lineHeight="1.6">
              Supabase Syncer enables bidirectional synchronization between PostgreSQL databases. Supports one-way and two-way sync with conflict resolution strategies.
            </Text>
          </VStack>

          {/* Overview */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Overview
              </Heading>
              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                Supabase Syncer enables bidirectional synchronization between PostgreSQL databases. Supports one-way and two-way sync with conflict resolution strategies.
              </Text>
            </CardBody>
          </Card>

          {/* Sync Types */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Sync Types
              </Heading>
              <VStack spacing={6} align="stretch">
                <Box borderLeft="4px" borderLeftColor="blue.500" pl={4}>
                  <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                    One-Way Sync
                  </Heading>
                  <Text color="surface.300" fontSize="sm" mb={3} lineHeight="1.6">
                    Data flows from source to target only. Source database is the authoritative source.
                  </Text>
                  <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                    <ListItem>Source → Target (only)</ListItem>
                    <ListItem>UPSERT operations (INSERT or UPDATE)</ListItem>
                    <ListItem>No data loss from target</ListItem>
                    <ListItem>Best for: Production → Staging, Master → Replica</ListItem>
                  </UnorderedList>
                </Box>
                <Divider borderColor="surface.700" />
                <Box borderLeft="4px" borderLeftColor="green.500" pl={4}>
                  <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                    Two-Way Sync
                  </Heading>
                  <Text color="surface.300" fontSize="sm" mb={3} lineHeight="1.6">
                    Data flows bidirectionally. Changes in either database are synced to the other.
                  </Text>
                  <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                    <ListItem>Source ↔ Target</ListItem>
                    <ListItem>Requires conflict resolution strategy</ListItem>
                    <ListItem>Best for: Multi-region deployments, Active-Active setups</ListItem>
                  </UnorderedList>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Sync Workflow */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Sync Workflow
              </Heading>
              <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px">
                <OrderedList spacing={2} color="surface.300" fontSize="sm" pl={4}>
                  <ListItem><strong>Create Sync Job:</strong> Define source, target, tables, and direction</ListItem>
                  <ListItem><strong>Validate Schema:</strong> Check compatibility between databases</ListItem>
                  <ListItem><strong>Generate Migration (if needed):</strong> Auto-fix schema differences</ListItem>
                  <ListItem><strong>Dry Run (optional):</strong> Preview changes without executing</ListItem>
                  <ListItem><strong>Start Sync:</strong> Begin synchronization process</ListItem>
                  <ListItem><strong>Monitor Progress:</strong> Track real-time metrics and logs</ListItem>
                  <ListItem><strong>Review Results:</strong> Check completion status and any errors</ListItem>
                </OrderedList>
              </Box>
            </CardBody>
          </Card>

          {/* Conflict Resolution */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Conflict Resolution
              </Heading>
              <VStack spacing={3} align="stretch">
                {[
                  { strategy: 'source_wins', desc: 'Source database values take precedence' },
                  { strategy: 'target_wins', desc: 'Target database values take precedence' },
                  { strategy: 'merge', desc: 'Attempts to merge changes intelligently' },
                ].map((item, index) => (
                  <Box key={item.strategy}>
                    <HStack spacing={3}>
                      <Code colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                        {item.strategy}
                      </Code>
                      <Text fontSize="sm" color="surface.400">
                        {item.desc}
                      </Text>
                    </HStack>
                    {index < 2 && <Divider borderColor="surface.700" mt={3} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Schema Validation */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Schema Validation
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                Before syncing, the system validates schema compatibility:
              </Text>
              <UnorderedList spacing={2} color="surface.300" fontSize="sm" pl={4} mb={4}>
                <ListItem>Table existence in both databases</ListItem>
                <ListItem>Column types and constraints</ListItem>
                <ListItem>Primary keys and indexes</ListItem>
                <ListItem>Foreign key relationships</ListItem>
                <ListItem>ENUM types</ListItem>
              </UnorderedList>
              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                If differences are found, the system can generate migration scripts to fix them.
              </Text>
            </CardBody>
          </Card>

          {/* Sync Status */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Sync Status
              </Heading>
              <VStack spacing={2} align="stretch">
                {[
                  { status: 'pending', desc: 'Created but not started' },
                  { status: 'running', desc: 'Currently executing' },
                  { status: 'completed', desc: 'Finished successfully' },
                  { status: 'failed', desc: 'Encountered an error' },
                  { status: 'paused', desc: 'Temporarily stopped' },
                ].map((item) => (
                  <HStack key={item.status} spacing={3}>
                    <Code colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                      {item.status}
                    </Code>
                    <Text fontSize="sm" color="surface.400">
                      - {item.desc}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Production Safeguards */}
          <Alert status="warning" bg="yellow.500/10" borderColor="yellow.500/30" borderWidth="1px" borderRadius="lg">
            <AlertIcon color="yellow.400" />
            <VStack align="start" spacing={3} flex={1}>
              <Heading as="h3" size="sm" color="white" fontWeight="600">
                Production Safeguards
              </Heading>
              <Text fontSize="sm" color="surface.300" fontWeight="600">
                Important: When syncing to production databases:
              </Text>
              <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                <ListItem>Extra confirmation required</ListItem>
                <ListItem>Dry-run preview available</ListItem>
                <ListItem>Breaking change warnings displayed</ListItem>
                <ListItem>All operations logged for audit</ListItem>
              </UnorderedList>
            </VStack>
          </Alert>

          {/* API Endpoints */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                API Endpoints
              </Heading>
              <VStack spacing={2} align="stretch">
                {[
                  'POST /api/sync - Create sync job',
                  'GET /api/sync - List sync jobs',
                  'GET /api/sync/[id] - Get sync details',
                  'POST /api/sync/[id]/start - Start sync',
                  'POST /api/sync/[id]/pause - Pause sync',
                  'POST /api/sync/[id]/stop - Stop sync',
                  'GET /api/sync/[id]/metrics - Get metrics',
                  'POST /api/sync/validate - Validate schema',
                  'POST /api/sync/generate-migration - Generate migration',
                ].map((endpoint) => (
                  <Code key={endpoint} colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md" display="block">
                    {endpoint}
                  </Code>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
