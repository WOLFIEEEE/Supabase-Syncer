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
              <VStack spacing={2} align="stretch">
                {[
                  { route: '/admin', desc: 'Main dashboard' },
                  { route: '/admin/users', desc: 'User management' },
                  { route: '/admin/sync-jobs', desc: 'Sync job management' },
                  { route: '/admin/security', desc: 'Security monitoring' },
                  { route: '/admin/analytics', desc: 'Analytics dashboard' },
                  { route: '/admin/system-health', desc: 'System health' },
                  { route: '/admin/audit-log', desc: 'Audit logs' },
                ].map((item) => (
                  <HStack key={item.route} spacing={3}>
                    <Code colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                      {item.route}
                    </Code>
                    <Text fontSize="sm" color="surface.400">
                      - {item.desc}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
