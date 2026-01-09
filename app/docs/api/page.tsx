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
} from '@chakra-ui/react';
import { ApiIcon } from '@/components/docs/DocsIcons';

export default function ApiDocsPage() {
  const apiGroups = [
    {
      title: 'Health & Status',
      endpoints: [
        {
          method: 'GET',
          path: '/api/health',
          description: 'Health check endpoint for uptime monitoring',
          auth: false,
          example: '/api/health',
        },
        {
          method: 'GET',
          path: '/api/status',
          description: 'Get system status and component health',
          auth: false,
          example: '/api/status',
        },
        {
          method: 'GET',
          path: '/api/version',
          description: 'Get version information and changelog',
          auth: false,
          example: '/api/version',
        },
        {
          method: 'GET',
          path: '/api/features',
          description: 'Get machine-readable list of all features',
          auth: false,
          example: '/api/features',
        },
      ],
    },
    {
      title: 'Connections',
      endpoints: [
        {
          method: 'GET',
          path: '/api/connections',
          description: 'List all database connections for authenticated user',
          auth: true,
          example: '/api/connections',
        },
        {
          method: 'POST',
          path: '/api/connections',
          description: 'Create a new database connection',
          auth: true,
          body: {
            name: 'string',
            databaseUrl: 'string',
            environment: 'production | development',
          },
          example: '/api/connections',
        },
        {
          method: 'GET',
          path: '/api/connections/[id]',
          description: 'Get connection details by ID',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000',
        },
        {
          method: 'POST',
          path: '/api/connections/[id]',
          description: 'Update connection details',
          auth: true,
          body: {
            name: 'string (optional)',
            databaseUrl: 'string (optional)',
            environment: 'production | development (optional)',
          },
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000',
        },
        {
          method: 'DELETE',
          path: '/api/connections/[id]',
          description: 'Delete a connection',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000',
        },
        {
          method: 'GET',
          path: '/api/connections/[id]/schema',
          description: 'Get full database schema for a connection',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/schema',
        },
        {
          method: 'POST',
          path: '/api/connections/[id]/test',
          description: 'Test database connection',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/test',
        },
        {
          method: 'POST',
          path: '/api/connections/[id]/execute',
          description: 'Execute SQL on a connection (requires production confirmation)',
          auth: true,
          body: {
            sql: 'string',
            confirmProduction: 'boolean (if production)',
          },
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/execute',
        },
        {
          method: 'GET',
          path: '/api/connections/[id]/keep-alive',
          description: 'Get keep-alive status for a connection',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/keep-alive',
        },
        {
          method: 'POST',
          path: '/api/connections/[id]/keep-alive',
          description: 'Enable/disable keep-alive for a connection',
          auth: true,
          body: {
            keepAlive: 'boolean',
          },
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/keep-alive',
        },
      ],
    },
    {
      title: 'Sync Operations',
      endpoints: [
        {
          method: 'GET',
          path: '/api/sync',
          description: 'List all sync jobs for authenticated user',
          auth: true,
          queryParams: {
            status: 'pending | running | completed | failed | paused (optional)',
            limit: 'number (optional, default: 50)',
            offset: 'number (optional, default: 0)',
          },
          example: '/api/sync?status=completed&limit=10',
        },
        {
          method: 'POST',
          path: '/api/sync',
          description: 'Create a new sync job',
          auth: true,
          body: {
            sourceConnectionId: 'string (UUID)',
            targetConnectionId: 'string (UUID)',
            direction: 'one_way | two_way',
            tables: [
              {
                tableName: 'string',
                enabled: 'boolean',
                conflictStrategy: 'source_wins | target_wins | merge (optional)',
              },
            ],
            dryRun: 'boolean (optional, default: false)',
          },
          example: '/api/sync',
        },
        {
          method: 'GET',
          path: '/api/sync/[id]',
          description: 'Get sync job details by ID',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000',
        },
        {
          method: 'POST',
          path: '/api/sync/[id]/start',
          description: 'Start a paused or pending sync job',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000/start',
        },
        {
          method: 'POST',
          path: '/api/sync/[id]/pause',
          description: 'Pause a running sync job',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000/pause',
        },
        {
          method: 'POST',
          path: '/api/sync/[id]/stop',
          description: 'Stop a running sync job',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000/stop',
        },
        {
          method: 'GET',
          path: '/api/sync/[id]/metrics',
          description: 'Get real-time metrics for a sync job',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000/metrics',
        },
        {
          method: 'POST',
          path: '/api/sync/validate',
          description: 'Validate schema compatibility between two connections',
          auth: true,
          body: {
            sourceConnectionId: 'string (UUID)',
            targetConnectionId: 'string (UUID)',
            tables: ['string (optional)'],
          },
          example: '/api/sync/validate',
        },
        {
          method: 'POST',
          path: '/api/sync/generate-migration',
          description: 'Generate SQL migration script to fix schema differences',
          auth: true,
          body: {
            sourceConnectionId: 'string (UUID)',
            targetConnectionId: 'string (UUID)',
            tables: ['string (optional)'],
          },
          example: '/api/sync/generate-migration',
        },
      ],
    },
    {
      title: 'Data Explorer',
      endpoints: [
        {
          method: 'GET',
          path: '/api/explorer/[connectionId]/tables',
          description: 'List all tables in a connection',
          auth: true,
          example: '/api/explorer/123e4567-e89b-12d3-a456-426614174000/tables',
        },
        {
          method: 'GET',
          path: '/api/explorer/[connectionId]/[table]/rows',
          description: 'Get paginated rows from a table',
          auth: true,
          queryParams: {
            limit: 'number (optional, default: 100)',
            offset: 'number (optional, default: 0)',
            orderBy: 'string (optional)',
            orderDirection: 'asc | desc (optional)',
          },
          example: '/api/explorer/123e4567-e89b-12d3-a456-426614174000/users/rows?limit=50',
        },
        {
          method: 'GET',
          path: '/api/explorer/[connectionId]/[table]/row',
          description: 'Get a single row by primary key',
          auth: true,
          queryParams: {
            id: 'string (primary key value)',
          },
          example: '/api/explorer/123e4567-e89b-12d3-a456-426614174000/users/row?id=123',
        },
      ],
    },
    {
      title: 'Sessions',
      endpoints: [
        {
          method: 'GET',
          path: '/api/sessions',
          description: 'Get all active sessions for authenticated user',
          auth: true,
          example: '/api/sessions',
        },
        {
          method: 'DELETE',
          path: '/api/sessions',
          description: 'Sign out from all devices',
          auth: true,
          example: '/api/sessions',
        },
        {
          method: 'DELETE',
          path: '/api/sessions/[id]',
          description: 'Sign out from a specific session',
          auth: true,
          example: '/api/sessions/123e4567-e89b-12d3-a456-426614174000',
        },
      ],
    },
    {
      title: 'Usage & Limits',
      endpoints: [
        {
          method: 'GET',
          path: '/api/usage',
          description: 'Get usage statistics and limits for authenticated user',
          auth: true,
          example: '/api/usage',
        },
      ],
    },
    {
      title: 'CSRF Protection',
      endpoints: [
        {
          method: 'GET',
          path: '/api/csrf',
          description: 'Get CSRF token for protected operations',
          auth: true,
          example: '/api/csrf',
        },
      ],
    },
    {
      title: 'Cron Jobs',
      endpoints: [
        {
          method: 'GET',
          path: '/api/cron/keep-alive',
          description: 'Cron endpoint to ping databases with keep-alive enabled',
          auth: false,
          note: 'Protected by Vercel Cron secret',
          example: '/api/cron/keep-alive',
        },
      ],
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'green';
      case 'POST':
        return 'blue';
      case 'PUT':
      case 'PATCH':
        return 'yellow';
      case 'DELETE':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box minH="100vh">
      <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Icon as={ApiIcon} w={8} h={8} color="green.400" />
              <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
                API REFERENCE
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
              API Reference
            </Heading>
            <Text fontSize="lg" color="surface.400" lineHeight="1.6">
              Complete documentation for all API endpoints. All endpoints return JSON responses.
            </Text>
          </VStack>

          {/* Authentication Section */}
          <Alert status="info" bg="blue.500/10" borderColor="blue.500/30" borderWidth="1px" borderRadius="lg">
            <AlertIcon color="blue.400" />
            <VStack align="start" spacing={2} flex={1}>
              <Heading as="h3" size="sm" color="white" fontWeight="600">
                Authentication
              </Heading>
              <Text fontSize="sm" color="surface.300">
                Most endpoints require authentication via Supabase. Include your session cookie or Bearer token in requests.
              </Text>
              <Box bg="surface.900" borderRadius="md" p={3} borderColor="surface.700" borderWidth="1px" w="100%">
                <Code colorScheme="blue" fontSize="xs" display="block" mb={2}>
                  <strong>Header:</strong> Authorization: Bearer {'<token>'}
                </Code>
                <Code colorScheme="blue" fontSize="xs" display="block">
                  <strong>Or:</strong> Session cookie (automatically included in browser requests)
                </Code>
              </Box>
            </VStack>
          </Alert>

          {/* API Groups */}
          {apiGroups.map((group, groupIndex) => (
            <Box key={groupIndex} id={group.title.toLowerCase().replace(/\s+/g, '-')}>
              <Heading
                as="h2"
                size="lg"
                mb={6}
                color="white"
                fontWeight="600"
                pb={3}
                borderBottom="2px solid"
                borderColor="surface.700"
              >
                {group.title}
              </Heading>

              <VStack spacing={6} align="stretch">
                {group.endpoints.map((endpoint, index) => (
                  <Card key={index} bg="surface.800" borderColor="surface.700" borderWidth="1px" borderLeft="4px" borderLeftColor={`${getMethodColor(endpoint.method)}.500`}>
                    <CardBody p={6}>
                      <VStack align="stretch" spacing={4}>
                        {/* Method, Path, Auth Badge */}
                        <HStack spacing={3} flexWrap="wrap">
                          <Badge colorScheme={getMethodColor(endpoint.method)} px={3} py={1} borderRadius="md" fontSize="xs" fontWeight="700">
                            {endpoint.method}
                          </Badge>
                          <Code colorScheme="whiteAlpha" fontSize="md" fontWeight="600" color="white">
                            {endpoint.path}
                          </Code>
                          {endpoint.auth ? (
                            <Badge colorScheme="yellow" fontSize="xs" borderRadius="md">
                              Auth Required
                            </Badge>
                          ) : (
                            <Badge colorScheme="green" fontSize="xs" borderRadius="md">
                              Public
                            </Badge>
                          )}
                        </HStack>

                        {/* Description */}
                        <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                          {endpoint.description}
                        </Text>

                        {/* Request Body */}
                        {'body' in endpoint && endpoint.body && (
                          <Box>
                            <Heading as="h4" size="xs" color="white" mb={2} fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                              Request Body:
                            </Heading>
                            <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                              <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                                {JSON.stringify(endpoint.body, null, 2)}
                              </Code>
                            </Box>
                          </Box>
                        )}

                        {/* Query Parameters */}
                        {'queryParams' in endpoint && endpoint.queryParams && (
                          <Box>
                            <Heading as="h4" size="xs" color="white" mb={2} fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                              Query Parameters:
                            </Heading>
                            <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                              <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                                {JSON.stringify(endpoint.queryParams, null, 2)}
                              </Code>
                            </Box>
                          </Box>
                        )}

                        {/* Note */}
                        {'note' in endpoint && endpoint.note && (
                          <Alert status="warning" bg="yellow.500/10" borderColor="yellow.500/30" borderWidth="1px" borderRadius="md">
                            <AlertIcon color="yellow.400" />
                            <Text fontSize="sm" color="surface.300">
                              <strong>Note:</strong> {endpoint.note}
                            </Text>
                          </Alert>
                        )}

                        {/* Example */}
                        <Box>
                          <Heading as="h4" size="xs" color="white" mb={2} fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                            Example:
                          </Heading>
                          <Box bg="surface.900" borderRadius="md" p={3} borderColor="surface.700" borderWidth="1px">
                            <Code colorScheme="green" fontSize="sm" color="green.300">
                              {endpoint.example}
                            </Code>
                          </Box>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </Box>
          ))}

          {/* Response Format */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Response Format
              </Heading>
              <Text color="surface.300" mb={4} fontSize="sm">
                All API responses follow this structure:
              </Text>
              <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto" mb={4}>
                <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                  {`{
  "success": true | false,
  "data": { ... } | null,
  "error": "string" | null,
  "message": "string" | null
}`}
                </Code>
              </Box>
              <Text color="surface.300" fontSize="sm">
                <strong>Status Codes:</strong> 200 (Success), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 429 (Rate Limited), 500 (Server Error)
              </Text>
            </CardBody>
          </Card>

          {/* Rate Limiting */}
          <Alert status="warning" bg="orange.500/10" borderColor="orange.500/30" borderWidth="1px" borderRadius="lg">
            <AlertIcon color="orange.400" />
            <VStack align="start" spacing={3} flex={1}>
              <Heading as="h3" size="sm" color="white" fontWeight="600">
                Rate Limiting
              </Heading>
              <Text fontSize="sm" color="surface.300">
                API requests are rate-limited to prevent abuse. Rate limit headers are included in responses:
              </Text>
              <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                <ListItem>
                  <Code fontSize="xs">X-RateLimit-Limit</Code> - Maximum requests allowed
                </ListItem>
                <ListItem>
                  <Code fontSize="xs">X-RateLimit-Remaining</Code> - Remaining requests in current window
                </ListItem>
                <ListItem>
                  <Code fontSize="xs">X-RateLimit-Reset</Code> - Time when rate limit resets (Unix timestamp)
                </ListItem>
              </UnorderedList>
              <Text fontSize="sm" color="surface.300" mt={2}>
                When rate limited, you'll receive a 429 status code with a retry-after header.
              </Text>
            </VStack>
          </Alert>
        </VStack>
      </Container>
    </Box>
  );
}
