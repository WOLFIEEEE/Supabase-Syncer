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
  UnorderedList,
  ListItem,
  Badge,
  Icon,
  Alert,
  AlertIcon,
  Divider,
} from '@chakra-ui/react';
import { AdminIcon } from '@/components/docs/DocsIcons';

export default function AdminDocsPage() {
  return (
    <Box minH="100vh">
      <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Icon as={AdminIcon} w={8} h={8} color="orange.400" />
              <Badge colorScheme="orange" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
                ADMIN FEATURES
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
              Admin Features
            </Heading>
            <Text fontSize="lg" color="surface.400" lineHeight="1.6">
              Comprehensive monitoring, analytics, and management capabilities for Supabase Syncer.
            </Text>
          </VStack>

          {/* Overview */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Overview
              </Heading>
              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                The admin dashboard provides comprehensive monitoring, analytics, and management capabilities for Supabase Syncer. Access is restricted to the configured admin email.
              </Text>
            </CardBody>
          </Card>

          {/* Access Control */}
          <Card bg="surface.800" borderColor="red.500/30" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Access Control
              </Heading>
              <Alert status="error" bg="red.500/10" borderColor="red.500/30" borderWidth="1px" borderRadius="md" mb={4}>
                <AlertIcon color="red.400" />
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontSize="sm" color="red.300" fontWeight="600">
                    Security: Admin access requires exact email match.
                  </Text>
                  <Text fontSize="xs" color="red.300/80">
                    Configured via <Code fontSize="xs" colorScheme="red">ADMIN_EMAIL</Code> environment variable.
                  </Text>
                </VStack>
              </Alert>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                The system performs strict email verification:
              </Text>
              <UnorderedList spacing={2} color="surface.300" fontSize="sm" pl={4}>
                <ListItem>User must be authenticated (logged in)</ListItem>
                <ListItem>User email must exactly match <Code fontSize="xs">ADMIN_EMAIL</Code></ListItem>
                <ListItem>Email comparison is case-insensitive but trimmed</ListItem>
                <ListItem>All access attempts are logged with detailed information</ListItem>
              </UnorderedList>
            </CardBody>
          </Card>

          {/* Admin Dashboard */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Admin Dashboard
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={6}>
                Access at <Code fontSize="xs" colorScheme="blue">/admin</Code>
              </Text>

              <VStack spacing={6} align="stretch">
                {[
                  {
                    title: 'Real-Time Metrics',
                    items: ['Active users count', 'Active syncs count', 'API requests per minute', 'Error rate percentage'],
                  },
                  {
                    title: 'User Statistics',
                    items: ['Total users', 'New users (24h, 7d, 30d)', 'Active users now and in last 24h'],
                  },
                  {
                    title: 'Sync Job Statistics',
                    items: ['Total, completed, failed, and running syncs', 'Success rate percentage', 'Syncs in last 24 hours', 'Average duration'],
                  },
                  {
                    title: 'Security Overview',
                    items: ['Events by severity (critical, high, medium, low)', 'Failed authentication attempts', 'Unique threat IPs', 'Recent security events'],
                  },
                  {
                    title: 'System Status',
                    items: ['API status', 'Database status', 'Queue status', 'Cache status'],
                  },
                ].map((section, index) => (
                  <Box key={section.title}>
                    <Heading as="h3" size="sm" mb={3} color="white" fontWeight="600">
                      {section.title}
                    </Heading>
                    <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                      {section.items.map((item, i) => (
                        <ListItem key={i}>{item}</ListItem>
                      ))}
                    </UnorderedList>
                    {index < 4 && <Divider borderColor="surface.700" mt={4} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Logging */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Logging
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                All admin operations are logged with detailed information:
              </Text>
              <UnorderedList spacing={2} color="surface.300" fontSize="sm" pl={4}>
                <ListItem><strong>Request IDs:</strong> Unique identifier for each request</ListItem>
                <ListItem><strong>Timestamps:</strong> ISO 8601 formatted timestamps</ListItem>
                <ListItem><strong>User Information:</strong> User ID and email</ListItem>
                <ListItem><strong>Email Verification:</strong> Logs whether email matches admin requirements</ListItem>
                <ListItem><strong>Duration Metrics:</strong> Time taken for operations</ListItem>
                <ListItem><strong>Error Details:</strong> Full error information with stack traces</ListItem>
                <ListItem><strong>IP Addresses:</strong> Client IP addresses (from headers)</ListItem>
                <ListItem><strong>User Agents:</strong> Browser/client information</ListItem>
              </UnorderedList>
            </CardBody>
          </Card>

          {/* Security Events */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Security Events
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                All security events are logged to the <Code fontSize="xs" colorScheme="blue">security_events</Code> table:
              </Text>
              <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                  {`{
  "event_type": "auth_failed | auth_success | permission_denied | ...",
  "severity": "low | medium | high | critical",
  "user_id": "uuid",
  "ip_address": "string",
  "user_agent": "string",
  "endpoint": "string",
  "method": "GET | POST | ...",
  "details": { ... },
  "request_id": "string",
  "created_at": "timestamp"
}`}
                </Code>
              </Box>
            </CardBody>
          </Card>

          {/* Admin Routes */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Admin Routes
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                The admin panel includes the following pages, all accessible via the sidebar navigation:
              </Text>
              <VStack spacing={3} align="stretch">
                {[
                  { route: '/admin', desc: 'Main dashboard with real-time metrics, charts, and system overview' },
                  { route: '/admin/users', desc: 'User management with search, filters, and export capabilities' },
                  { route: '/admin/sync-jobs', desc: 'Sync job management with bulk operations and real-time progress' },
                  { route: '/admin/security', desc: 'Security monitoring with event timeline and threat detection' },
                  { route: '/admin/analytics', desc: 'Analytics dashboard with charts and time-series visualizations' },
                  { route: '/admin/system-health', desc: 'System health monitoring with service status indicators' },
                  { route: '/admin/audit-log', desc: 'Comprehensive audit trail of all admin actions and events' },
                ].map((item) => (
                  <Box key={item.route} p={3} bg="surface.900" borderRadius="md" borderColor="surface.700" borderWidth="1px">
                    <HStack spacing={3} mb={1}>
                      <Code colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                        {item.route}
                      </Code>
                    </HStack>
                    <Text fontSize="sm" color="surface.400" mt={1}>
                      {item.desc}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* New Features */}
          <Card bg="surface.800" borderColor="brand.400/30" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Enhanced Features
              </Heading>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                    Navigation & Layout
                  </Heading>
                  <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                    <ListItem>Collapsible sidebar with navigation links</ListItem>
                    <ListItem>Responsive design with mobile hamburger menu</ListItem>
                    <ListItem>Active route highlighting</ListItem>
                    <ListItem>User profile section with logout</ListItem>
                    <ListItem>Top header with page title and quick actions</ListItem>
                  </UnorderedList>
                </Box>
                <Divider borderColor="surface.700" />
                <Box>
                  <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                    Data Visualization
                  </Heading>
                  <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                    <ListItem>Interactive charts using Recharts library</ListItem>
                    <ListItem>Line charts for time-series data</ListItem>
                    <ListItem>Bar charts for categorical data</ListItem>
                    <ListItem>Metric cards with trend indicators</ListItem>
                    <ListItem>Real-time data updates via polling</ListItem>
                  </UnorderedList>
                </Box>
                <Divider borderColor="surface.700" />
                <Box>
                  <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                    Management Features
                  </Heading>
                  <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                    <ListItem>User management with search and pagination</ListItem>
                    <ListItem>Sync job management with bulk operations</ListItem>
                    <ListItem>Security event monitoring with filtering</ListItem>
                    <ListItem>Analytics dashboard with date range selection</ListItem>
                    <ListItem>System health monitoring</ListItem>
                    <ListItem>Comprehensive audit log</ListItem>
                  </UnorderedList>
                </Box>
                <Divider borderColor="surface.700" />
                <Box>
                  <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                    Export & Bulk Operations
                  </Heading>
                  <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                    <ListItem>CSV export for all data tables</ListItem>
                    <ListItem>JSON export for analytics data</ListItem>
                    <ListItem>Bulk selection and actions for sync jobs</ListItem>
                    <ListItem>Filtered exports with applied filters</ListItem>
                  </UnorderedList>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* API Endpoints */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Admin API Endpoints
              </Heading>
              <VStack spacing={3} align="stretch">
                {[
                  { method: 'GET', route: '/api/admin/users', desc: 'List all users with search and pagination' },
                  { method: 'GET', route: '/api/admin/sync-jobs', desc: 'List all sync jobs with filters' },
                  { method: 'GET', route: '/api/admin/analytics', desc: 'Get analytics data (user-growth, sync-performance, api-usage, etc.)' },
                  { method: 'GET', route: '/api/admin/security-events', desc: 'Get security events with filters' },
                  { method: 'POST', route: '/api/admin/export', desc: 'Export data in CSV or JSON format' },
                ].map((item) => (
                  <Box key={item.route} p={3} bg="surface.900" borderRadius="md" borderColor="surface.700" borderWidth="1px">
                    <HStack spacing={3} mb={1}>
                      <Badge colorScheme={item.method === 'GET' ? 'blue' : 'green'} fontSize="xs">
                        {item.method}
                      </Badge>
                      <Code colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                        {item.route}
                      </Code>
                    </HStack>
                    <Text fontSize="sm" color="surface.400" mt={1}>
                      {item.desc}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
