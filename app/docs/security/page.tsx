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
import { SecurityIcon } from '@/components/docs/DocsIcons';

export default function SecurityDocsPage() {
  return (
    <Box minH="100vh">
      <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Icon as={SecurityIcon} w={8} h={8} color="pink.400" />
              <Badge colorScheme="pink" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
                SECURITY
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
              Security
            </Heading>
            <Text fontSize="lg" color="surface.400" lineHeight="1.6">
              Security is a top priority. Supabase Syncer implements multiple layers of security to protect user data and prevent unauthorized access.
            </Text>
          </VStack>

          {/* Overview */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Overview
              </Heading>
              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                Security is a top priority. Supabase Syncer implements multiple layers of security to protect user data and prevent unauthorized access.
              </Text>
            </CardBody>
          </Card>

          {/* Encryption */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Encryption
              </Heading>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                    Connection String Encryption
                  </Heading>
                  <Text color="surface.300" fontSize="sm" mb={3} lineHeight="1.6">
                    All database connection strings are encrypted using AES-256-GCM before storage.
                  </Text>
                  <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                    <ListItem>Encryption key stored in environment variable</ListItem>
                    <ListItem>Automatic encryption on save</ListItem>
                    <ListItem>Automatic decryption on use</ListItem>
                    <ListItem>Never stored in plain text</ListItem>
                  </UnorderedList>
                </Box>
                <Divider borderColor="surface.700" />
                <Box>
                  <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                    Encryption Algorithm
                  </Heading>
                  <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                    <strong>AES-256-GCM:</strong> Advanced Encryption Standard with 256-bit keys and Galois/Counter Mode for authenticated encryption.
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Authentication & Authorization */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Authentication & Authorization
              </Heading>
              <VStack spacing={4} align="stretch">
                {[
                  {
                    title: 'Supabase Auth',
                    desc: 'All authentication handled by Supabase Auth with secure session management.',
                  },
                  {
                    title: 'Row Level Security (RLS)',
                    desc: 'PostgreSQL RLS ensures users can only access their own data. Policies enforced at the database level.',
                  },
                  {
                    title: 'Admin Access',
                    desc: 'Admin features require exact email match. All access attempts logged with detailed security events.',
                  },
                ].map((item, index) => (
                  <Box key={item.title}>
                    <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                      {item.title}
                    </Heading>
                    <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                      {item.desc}
                    </Text>
                    {index < 2 && <Divider borderColor="surface.700" mt={4} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* CSRF Protection */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                CSRF Protection
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                All state-changing operations (POST, PUT, DELETE) require CSRF tokens:
              </Text>
              <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px">
                <OrderedList spacing={2} color="surface.300" fontSize="sm" pl={4}>
                  <ListItem>
                    Get CSRF token: <Code fontSize="xs" colorScheme="blue">GET /api/csrf</Code>
                  </ListItem>
                  <ListItem>
                    Include in request header: <Code fontSize="xs" colorScheme="blue">X-CSRF-Token: {'<token>'}</Code>
                  </ListItem>
                  <ListItem>Token validated server-side before processing</ListItem>
                </OrderedList>
              </Box>
            </CardBody>
          </Card>

          {/* Rate Limiting */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Rate Limiting
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                API requests are rate-limited to prevent abuse:
              </Text>
              <UnorderedList spacing={2} color="surface.300" fontSize="sm" pl={4}>
                <ListItem>Per-user rate limits</ListItem>
                <ListItem>Different limits for different operation types</ListItem>
                <ListItem>Rate limit headers in responses</ListItem>
                <ListItem>429 status code when exceeded</ListItem>
              </UnorderedList>
            </CardBody>
          </Card>

          {/* Input Validation */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Input Validation
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                All user inputs are validated using Zod schemas:
              </Text>
              <UnorderedList spacing={2} color="surface.300" fontSize="sm" pl={4}>
                <ListItem>Type checking</ListItem>
                <ListItem>Format validation</ListItem>
                <ListItem>Length constraints</ListItem>
                <ListItem>SQL injection prevention via parameterized queries</ListItem>
                <ListItem>XSS prevention via output sanitization</ListItem>
              </UnorderedList>
            </CardBody>
          </Card>

          {/* Security Headers */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Security Headers
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                All responses include security headers via proxy.ts:
              </Text>
              <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                  {`Content-Security-Policy
Strict-Transport-Security
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy
Permissions-Policy`}
                </Code>
              </Box>
            </CardBody>
          </Card>

          {/* Security Logging */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Security Logging
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                All security events are logged to the <Code fontSize="xs" colorScheme="blue">security_events</Code> table:
              </Text>
              <UnorderedList spacing={2} color="surface.300" fontSize="sm" pl={4}>
                <ListItem>Failed authentication attempts</ListItem>
                <ListItem>Permission denied events</ListItem>
                <ListItem>Rate limit violations</ListItem>
                <ListItem>CSRF validation failures</ListItem>
                <ListItem>Suspicious activity patterns</ListItem>
                <ListItem>Admin access attempts</ListItem>
              </UnorderedList>
            </CardBody>
          </Card>

          {/* Best Practices */}
          <Alert status="info" bg="blue.500/10" borderColor="blue.500/30" borderWidth="1px" borderRadius="lg">
            <AlertIcon color="blue.400" />
            <VStack align="start" spacing={3} flex={1}>
              <Heading as="h3" size="sm" color="white" fontWeight="600">
                Best Practices
              </Heading>
              <UnorderedList spacing={1} color="surface.300" fontSize="sm" pl={4}>
                <ListItem>Never commit environment variables or secrets</ListItem>
                <ListItem>Use strong, unique passwords</ListItem>
                <ListItem>Enable two-factor authentication on Supabase</ListItem>
                <ListItem>Regularly review security events</ListItem>
                <ListItem>Keep dependencies updated</ListItem>
                <ListItem>Use HTTPS in production</ListItem>
                <ListItem>Regular security audits</ListItem>
              </UnorderedList>
            </VStack>
          </Alert>
        </VStack>
      </Container>
    </Box>
  );
}
