/**
 * API Reference Documentation
 * 
 * Comprehensive API documentation with all endpoints, examples, and response schemas.
 */

'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Code,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';

// Method badge component
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    GET: { bg: 'green.900', color: 'green.300' },
    POST: { bg: 'blue.900', color: 'blue.300' },
    PUT: { bg: 'orange.900', color: 'orange.300' },
    DELETE: { bg: 'red.900', color: 'red.300' },
    PATCH: { bg: 'purple.900', color: 'purple.300' },
  };
  const { bg, color } = colors[method] || { bg: 'gray.700', color: 'gray.300' };

  return (
    <Badge bg={bg} color={color} px={2} py={0.5} borderRadius="md" fontSize="xs" fontWeight="600">
      {method}
              </Badge>
  );
}

// Endpoint card component
function Endpoint({
  method,
  path,
  description,
  auth,
  children,
}: {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="gray.800"
      borderRadius="lg"
      overflow="hidden"
    >
      <Box p={4} bg="rgba(255, 255, 255, 0.02)">
        <HStack spacing={3} mb={2}>
          <MethodBadge method={method} />
          <Code bg="transparent" color="white" fontSize="sm" fontWeight="500">
            {path}
                          </Code>
          {auth && (
            <Badge colorScheme="yellow" fontSize="10px" variant="outline">
                              Auth Required
                            </Badge>
                          )}
                        </HStack>
        <Text color="gray.400" fontSize="sm">
          {description}
                        </Text>
                            </Box>
      {children && (
        <Box p={4} borderTop="1px solid" borderColor="gray.800">
          {children}
                          </Box>
                        )}
                            </Box>
  );
}

// Code block component
function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  return (
    <Box
      bg="rgba(0, 0, 0, 0.4)"
      borderRadius="md"
      p={4}
      overflowX="auto"
      fontSize="sm"
      fontFamily="mono"
    >
      <pre style={{ margin: 0, color: '#e2e8f0' }}>
        <code>{code}</code>
      </pre>
                          </Box>
  );
}

// Section component
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Box id={id} scrollMarginTop="100px">
      <Text fontSize="xl" fontWeight="600" color="white" mb={4}>
        {title}
                            </Text>
      <VStack align="stretch" spacing={4}>
        {children}
      </VStack>
    </Box>
  );
}

export default function ApiPage() {
  return (
    <VStack align="stretch" spacing={10}>
      {/* Header */}
                        <Box>
        <Badge colorScheme="blue" mb={4} fontSize="xs" px={2} py={1} borderRadius="full">
          API REFERENCE
        </Badge>
        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700" color="white" mb={3}>
          REST API Reference
        </Text>
        <Text color="gray.400" lineHeight="1.7">
          Complete reference for all Suparbase REST API endpoints. All endpoints return JSON responses.
        </Text>
      </Box>

      {/* Base URL */}
      <Box
        p={4}
        bg="rgba(255, 255, 255, 0.02)"
        border="1px solid"
        borderColor="gray.800"
        borderRadius="lg"
      >
        <Text fontSize="sm" fontWeight="600" color="gray.500" mb={2}>
          BASE URL
        </Text>
        <Code bg="transparent" color="teal.300" fontSize="md">
          https://suparbase.com/api
                            </Code>
                          </Box>

      {/* Authentication */}
      <Box>
        <Text fontSize="lg" fontWeight="600" color="white" mb={3}>
          Authentication
        </Text>
        <Text color="gray.400" fontSize="sm" mb={4} lineHeight="1.7">
          Most endpoints require authentication via Supabase Auth. Include the access token in the Authorization header:
        </Text>
        <CodeBlock code={`Authorization: Bearer <your_access_token>`} language="bash" />
                        </Box>

      <Divider borderColor="gray.800" />

      {/* Health Endpoints */}
      <Section id="health" title="Health & Status">
        <Endpoint
          method="GET"
          path="/api/health"
          description="Returns detailed health status of all system components including Supabase, backend, Redis, and encryption status."
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Response
          </Text>
          <CodeBlock
            code={`{
  "status": "healthy",
  "timestamp": "2026-01-13T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "supabase": { "status": "ok", "latency": 45 },
    "backend": { "status": "ok", "latency": 120 },
    "redis": { "status": "ok" },
    "encryption": { "status": "ok" }
  },
  "metrics": {
    "memory": { "used": 128, "total": 512, "percentage": 25 }
  }
}`}
          />
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/backend-health"
          description="Proxied health check for the backend server (avoids CORS issues)."
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Response
          </Text>
          <CodeBlock
            code={`{
  "healthy": true,
  "status": "healthy",
  "latency": 120
}`}
          />
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/status"
          description="Returns comprehensive system status and statistics."
        />
      </Section>

      <Divider borderColor="gray.800" />

      {/* Connections Endpoints */}
      <Section id="connections" title="Connections API">
        <Endpoint
          method="GET"
          path="/api/connections"
          description="List all database connections for the authenticated user."
          auth
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Response
          </Text>
          <CodeBlock
            code={`{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production DB",
      "environment": "production",
      "keep_alive": true,
      "last_pinged_at": "2026-01-13T12:00:00.000Z",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}`}
          />
        </Endpoint>

        <Endpoint
          method="POST"
          path="/api/connections"
          description="Create a new database connection."
          auth
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Request Body
          </Text>
          <CodeBlock
            code={`{
  "name": "My Database",
  "databaseUrl": "postgresql://user:pass@host:5432/dbname",
  "environment": "development"
}`}
          />
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/connections/:id"
          description="Get a specific connection by ID."
          auth
        />

        <Endpoint
          method="PUT"
          path="/api/connections/:id"
          description="Update an existing connection."
          auth
        />

        <Endpoint
          method="DELETE"
          path="/api/connections/:id"
          description="Delete a connection."
          auth
        />

        <Endpoint
          method="POST"
          path="/api/connections/:id/test"
          description="Test if a connection is working."
          auth
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Response
          </Text>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "connected": true,
    "latency": 45,
    "version": "PostgreSQL 15.2"
  }
}`}
          />
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/connections/:id/schema"
          description="Get the database schema for a connection."
          auth
        />

        <Endpoint
          method="POST"
          path="/api/connections/:id/execute"
          description="Execute SQL on a connection. Requires CSRF token and production confirmation for production databases."
          auth
        />
      </Section>

      <Divider borderColor="gray.800" />

      {/* Sync Endpoints */}
      <Section id="sync" title="Sync API">
        <Endpoint
          method="GET"
          path="/api/sync"
          description="List all sync jobs for the authenticated user."
          auth
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Query Parameters
          </Text>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th color="gray.500" borderColor="gray.700">Parameter</Th>
                  <Th color="gray.500" borderColor="gray.700">Type</Th>
                  <Th color="gray.500" borderColor="gray.700">Default</Th>
                  <Th color="gray.500" borderColor="gray.700">Description</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">limit</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">integer</Td>
                  <Td borderColor="gray.800" color="gray.400">50</Td>
                  <Td borderColor="gray.800" color="gray.400">Max results to return</Td>
                </Tr>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">offset</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">integer</Td>
                  <Td borderColor="gray.800" color="gray.400">0</Td>
                  <Td borderColor="gray.800" color="gray.400">Number of results to skip</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Endpoint>

        <Endpoint
          method="POST"
          path="/api/sync"
          description="Create a new sync job."
          auth
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Request Body
          </Text>
          <CodeBlock
            code={`{
  "sourceConnectionId": "uuid",
  "targetConnectionId": "uuid",
  "direction": "one_way",
  "tables": [
    {
      "tableName": "users",
      "enabled": true,
      "conflictStrategy": "last_write_wins"
    }
  ],
  "dryRun": false
}`}
          />
          <Box mt={4}>
            <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
              Conflict Strategies
            </Text>
            <VStack align="stretch" spacing={1}>
              {[
                { value: 'last_write_wins', desc: 'Most recent write wins' },
                { value: 'source_wins', desc: 'Source always wins' },
                { value: 'target_wins', desc: 'Target always wins' },
                { value: 'manual', desc: 'Requires manual resolution' },
              ].map((s) => (
                <HStack key={s.value} spacing={2}>
                  <Code fontSize="xs">{s.value}</Code>
                  <Text fontSize="xs" color="gray.400">- {s.desc}</Text>
                </HStack>
                ))}
              </VStack>
            </Box>
        </Endpoint>

        <Endpoint
          method="POST"
          path="/api/sync/:id/start"
          description="Start or resume a sync job."
          auth
        />

        <Endpoint
          method="POST"
          path="/api/sync/:id/stop"
          description="Stop a running sync job."
          auth
        />

        <Endpoint
          method="POST"
          path="/api/sync/:id/pause"
          description="Pause a running sync job (can be resumed)."
          auth
        />

        <Endpoint
          method="GET"
          path="/api/sync/:id/stream"
          description="Stream sync progress via Server-Sent Events (SSE)."
          auth
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Event Types
          </Text>
          <CodeBlock
            code={`event: progress
data: {"table": "users", "processed": 100, "total": 1000}

event: complete
data: {"status": "completed", "duration": 45000}

event: error
data: {"error": "Connection lost"}`}
          />
        </Endpoint>

        <Endpoint
          method="POST"
          path="/api/sync/validate"
          description="Validate sync configuration before creating a job."
          auth
        />

        <Endpoint
          method="POST"
          path="/api/sync/generate-migration"
          description="Generate SQL migration script to fix schema differences."
          auth
        />
      </Section>

      <Divider borderColor="gray.800" />

      {/* Explorer Endpoints */}
      <Section id="explorer" title="Explorer API">
        <Endpoint
          method="GET"
          path="/api/explorer/:connectionId/tables"
          description="List all tables in a database with metadata."
          auth
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Response
              </Text>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "rowCount": 1000,
        "columnCount": 10,
        "columns": [
          { "name": "id", "type": "uuid", "nullable": false },
          { "name": "email", "type": "text", "nullable": false }
        ]
      }
    ],
    "total": 15
  }
}`}
          />
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/explorer/:connectionId/:table/rows"
          description="Get paginated rows from a table."
          auth
        >
          <Text fontSize="sm" fontWeight="500" color="white" mb={2}>
            Query Parameters
          </Text>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th color="gray.500" borderColor="gray.700">Parameter</Th>
                  <Th color="gray.500" borderColor="gray.700">Type</Th>
                  <Th color="gray.500" borderColor="gray.700">Default</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">page</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">integer</Td>
                  <Td borderColor="gray.800" color="gray.400">1</Td>
                </Tr>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">limit</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">integer</Td>
                  <Td borderColor="gray.800" color="gray.400">50</Td>
                </Tr>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">orderBy</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">string</Td>
                  <Td borderColor="gray.800" color="gray.400">id</Td>
                </Tr>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">orderDir</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">asc | desc</Td>
                  <Td borderColor="gray.800" color="gray.400">desc</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Endpoint>

        <Endpoint
          method="POST"
          path="/api/explorer/:connectionId/:table/row"
          description="Insert a new row into a table."
          auth
        />

        <Endpoint
          method="PUT"
          path="/api/explorer/:connectionId/:table/row"
          description="Update an existing row."
          auth
        />

        <Endpoint
          method="DELETE"
          path="/api/explorer/:connectionId/:table/row"
          description="Delete a row from a table."
          auth
        />
      </Section>

      <Divider borderColor="gray.800" />

      {/* Admin Endpoints */}
      <Section id="admin" title="Admin API">
        <Text color="gray.400" fontSize="sm" mb={4}>
          Admin endpoints require the authenticated user to have admin privileges.
        </Text>

        <Endpoint
          method="GET"
          path="/api/admin/users"
          description="List all users in the system."
          auth
        />

        <Endpoint
          method="GET"
          path="/api/admin/sync-jobs"
          description="List all sync jobs across all users."
          auth
        />

        <Endpoint
          method="GET"
          path="/api/admin/analytics"
          description="Get system analytics and statistics."
          auth
        />

        <Endpoint
          method="GET"
          path="/api/admin/security-events"
          description="Get security events and audit logs."
          auth
        />

        <Endpoint
          method="GET"
          path="/api/admin/export"
          description="Export system data."
          auth
        />
      </Section>

      <Divider borderColor="gray.800" />

      {/* Rate Limits */}
      <Box>
        <Text fontSize="lg" fontWeight="600" color="white" mb={3}>
          Rate Limits
        </Text>
        <Text color="gray.400" fontSize="sm" mb={4}>
          API requests are rate limited per user to ensure fair usage.
        </Text>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th color="gray.500" borderColor="gray.700">Operation Type</Th>
                <Th color="gray.500" borderColor="gray.700">Limit</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td borderColor="gray.800" color="white">Read operations</Td>
                <Td borderColor="gray.800" color="gray.400">100 requests/minute</Td>
              </Tr>
              <Tr>
                <Td borderColor="gray.800" color="white">Write operations</Td>
                <Td borderColor="gray.800" color="gray.400">20 requests/minute</Td>
              </Tr>
              <Tr>
                <Td borderColor="gray.800" color="white">Sync operations</Td>
                <Td borderColor="gray.800" color="gray.400">10 requests/minute</Td>
              </Tr>
              <Tr>
                <Td borderColor="gray.800" color="white">Admin operations</Td>
                <Td borderColor="gray.800" color="gray.400">50 requests/minute</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
              </Box>

      {/* Error Codes */}
      <Box>
        <Text fontSize="lg" fontWeight="600" color="white" mb={3}>
          Error Responses
              </Text>
        <Text color="gray.400" fontSize="sm" mb={4}>
          All errors follow a consistent format:
              </Text>
        <CodeBlock
          code={`{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}`}
        />
        <Box mt={4}>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th color="gray.500" borderColor="gray.700">Code</Th>
                  <Th color="gray.500" borderColor="gray.700">Status</Th>
                  <Th color="gray.500" borderColor="gray.700">Description</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">UNAUTHORIZED</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">401</Td>
                  <Td borderColor="gray.800" color="gray.400">Authentication required</Td>
                </Tr>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">FORBIDDEN</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">403</Td>
                  <Td borderColor="gray.800" color="gray.400">Access denied</Td>
                </Tr>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">NOT_FOUND</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">404</Td>
                  <Td borderColor="gray.800" color="gray.400">Resource not found</Td>
                </Tr>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">VALIDATION_ERROR</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">400</Td>
                  <Td borderColor="gray.800" color="gray.400">Invalid input</Td>
                </Tr>
                <Tr>
                  <Td borderColor="gray.800"><Code fontSize="xs">RATE_LIMIT</Code></Td>
                  <Td borderColor="gray.800" color="gray.400">429</Td>
                  <Td borderColor="gray.800" color="gray.400">Too many requests</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
        </VStack>
  );
}
