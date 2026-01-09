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
  OrderedList,
  ListItem,
} from '@chakra-ui/react';
import { AuthIcon } from '@/components/docs/DocsIcons';

export default function AuthenticationDocsPage() {
  return (
    <Box minH="100vh">
      <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Icon as={AuthIcon} w={8} h={8} color="red.400" />
              <Badge colorScheme="red" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
                AUTHENTICATION
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
              Authentication
            </Heading>
            <Text fontSize="lg" color="surface.400" lineHeight="1.6">
              Supabase Syncer uses Supabase Auth for authentication. All API endpoints (except public health/status endpoints) require authentication.
            </Text>
          </VStack>

          {/* Overview */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Overview
              </Heading>
              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                Supabase Syncer uses Supabase Auth for authentication. All API endpoints (except public health/status endpoints) require authentication.
              </Text>
            </CardBody>
          </Card>

          {/* Authentication Methods */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Authentication Methods
              </Heading>
              <VStack spacing={6} align="stretch">
                <Box>
                  <HStack spacing={2} mb={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs">
                      1
                    </Badge>
                    <Heading as="h3" size="sm" color="white" fontWeight="600">
                      Session Cookies (Browser)
                    </Heading>
                  </HStack>
                  <Text color="surface.300" fontSize="sm" pl={8} lineHeight="1.6">
                    When using the web interface, authentication is handled automatically via session cookies.
                  </Text>
                </Box>
                <Divider borderColor="surface.700" />
                <Box>
                  <HStack spacing={2} mb={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs">
                      2
                    </Badge>
                    <Heading as="h3" size="sm" color="white" fontWeight="600">
                      Bearer Token (API)
                    </Heading>
                  </HStack>
                  <Text color="surface.300" fontSize="sm" mb={3} pl={8} lineHeight="1.6">
                    For API requests, include the access token in the Authorization header:
                  </Text>
                  <Box bg="surface.900" borderRadius="md" p={3} borderColor="surface.700" borderWidth="1px" ml={8}>
                    <Code colorScheme="blue" fontSize="sm">
                      Authorization: Bearer {'<access_token>'}
                    </Code>
                  </Box>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Getting Access Token */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Getting an Access Token
              </Heading>
              <Box mb={4}>
                <Heading as="h3" size="xs" mb={3} color="white" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                  Using Supabase Client
                </Heading>
                <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                  <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                    {`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const accessToken = session?.access_token;`}
                  </Code>
                </Box>
              </Box>
            </CardBody>
          </Card>

          {/* Session Management */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Session Management
              </Heading>
              <VStack spacing={4} align="stretch">
                {[
                  { endpoint: 'GET /api/sessions', desc: 'Returns all active sessions for the authenticated user.' },
                  { endpoint: 'DELETE /api/sessions', desc: 'Invalidates all sessions for the user.' },
                  { endpoint: 'DELETE /api/sessions/[id]', desc: 'Invalidates a specific session.' },
                ].map((item, index) => (
                  <Box key={item.endpoint}>
                    <HStack spacing={3} mb={2}>
                      <Code colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md">
                        {item.endpoint}
                      </Code>
                    </HStack>
                    <Text fontSize="sm" color="surface.400" pl={2}>
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
                All state-changing operations (POST, PUT, DELETE) require CSRF protection.
              </Text>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading as="h3" size="xs" mb={3} color="white" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                    Getting a CSRF Token
                  </Heading>
                  <Box bg="surface.900" borderRadius="md" p={3} borderColor="surface.700" borderWidth="1px" mb={3}>
                    <Code colorScheme="green" fontSize="sm">
                      GET /api/csrf
                    </Code>
                  </Box>
                  <Text color="surface.300" fontSize="sm" mb={3} lineHeight="1.6">
                    Returns a CSRF token that must be included in subsequent requests.
                  </Text>
                  <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                    <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                      {`{
  "csrfToken": "token_value"
}`}
                    </Code>
                  </Box>
                </Box>
                <Divider borderColor="surface.700" />
                <Box>
                  <Heading as="h3" size="xs" mb={3} color="white" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                    Including CSRF Token
                  </Heading>
                  <Box bg="surface.900" borderRadius="md" p={3} borderColor="surface.700" borderWidth="1px">
                    <Code colorScheme="blue" fontSize="sm">
                      X-CSRF-Token: {'<csrf_token>'}
                    </Code>
                  </Box>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Admin Authentication */}
          <Card bg="surface.800" borderColor="red.500/30" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Admin Authentication
              </Heading>
              <Text color="surface.300" fontSize="sm" mb={4} lineHeight="1.6">
                Admin endpoints require additional authentication. Only users with the exact admin email address can access admin features.
              </Text>
              <Alert status="error" bg="red.500/10" borderColor="red.500/30" borderWidth="1px" borderRadius="md">
                <AlertIcon color="red.400" />
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontSize="sm" color="red.300" fontWeight="600">
                    Security: Admin email is configured via <Code fontSize="xs" colorScheme="red">ADMIN_EMAIL</Code> environment variable.
                  </Text>
                  <Text fontSize="xs" color="red.300/80">
                    Default: <Code fontSize="xs" colorScheme="red">kgpkhushwant1@gmail.com</Code>
                  </Text>
                </VStack>
              </Alert>
            </CardBody>
          </Card>

          {/* Error Responses */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Error Responses
              </Heading>
              <VStack spacing={3} align="stretch">
                {[
                  { code: '401 Unauthorized', desc: 'Authentication required or invalid token' },
                  { code: '403 Forbidden', desc: 'Valid authentication but insufficient permissions' },
                  { code: '429 Too Many Requests', desc: 'Rate limit exceeded' },
                ].map((item) => (
                  <HStack key={item.code} spacing={3}>
                    <Code colorScheme="red" fontSize="xs" px={2} py={1} borderRadius="md">
                      {item.code}
                    </Code>
                    <Text fontSize="sm" color="surface.400">
                      {item.desc}
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
