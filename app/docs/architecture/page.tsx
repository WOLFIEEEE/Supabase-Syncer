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
  SimpleGrid,
  UnorderedList,
  ListItem,
  OrderedList,
} from '@chakra-ui/react';
import { ArchitectureIcon } from '@/components/docs/DocsIcons';

export default function ArchitectureDocsPage() {
  const techStack = [
    {
      category: 'Frontend',
      items: ['Next.js 16.1.1 (App Router)', 'React 19.2.3', 'TypeScript 5.1.0+', 'Chakra UI'],
    },
    {
      category: 'Backend',
      items: ['Next.js API Routes', 'Supabase (PostgreSQL)', 'Drizzle ORM', 'Node.js 20.9.0+'],
    },
    {
      category: 'Security',
      items: ['Supabase Auth', 'AES-256-GCM Encryption', 'CSRF Protection', 'Rate Limiting', 'Row Level Security (RLS)'],
    },
    {
      category: 'Infrastructure',
      items: ['Vercel (Hosting)', 'Supabase (Database & Auth)', 'Vercel Cron (Scheduled Jobs)'],
    },
  ];

  return (
    <Box minH="100vh">
      <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Icon as={ArchitectureIcon} w={8} h={8} color="indigo.400" />
              <Badge colorScheme="indigo" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
                ARCHITECTURE
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
              Architecture
            </Heading>
            <Text fontSize="lg" color="surface.400" lineHeight="1.6">
              Supabase Syncer is built with Next.js 16 (App Router), React 19, TypeScript, and Supabase. It follows modern best practices for security, scalability, and maintainability.
            </Text>
          </VStack>

          {/* Overview */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Overview
              </Heading>
              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                Supabase Syncer is built with Next.js 16 (App Router), React 19, TypeScript, and Supabase. It follows modern best practices for security, scalability, and maintainability.
              </Text>
            </CardBody>
          </Card>

          {/* Technology Stack */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Technology Stack
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {techStack.map((category) => (
                  <Card key={category.category} bg="surface.900" borderColor="surface.700" borderWidth="1px">
                    <CardBody p={4}>
                      <Heading as="h3" size="sm" mb={3} color="white" fontWeight="600">
                        {category.category}
                      </Heading>
                      <UnorderedList spacing={1} color="surface.300" fontSize="sm">
                        {category.items.map((item, i) => (
                          <ListItem key={i}>{item}</ListItem>
                        ))}
                      </UnorderedList>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Project Structure */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Project Structure
              </Heading>
              <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
                  {`app/
  (auth)/              # Authentication routes
  (public)/            # Public pages
  admin/               # Admin dashboard
  api/                 # API routes
  connections/         # Connection management
  dashboard/           # User dashboard
  docs/                # Documentation
  explorer/            # Data explorer
  sync/                # Sync operations

components/            # React components
  ui/                  # Reusable UI components
  explorer/            # Explorer components
  sync/                # Sync components

lib/
  services/            # Business logic services
  db/                  # Database code
  supabase/            # Supabase utilities
  middleware/          # Middleware utilities
  validations/         # Validation schemas
  utils/               # Utility functions

supabase/
  migrations/          # Database migrations

types/                 # TypeScript types`}
                </Code>
              </Box>
            </CardBody>
          </Card>

          {/* Design Patterns */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Design Patterns
              </Heading>
              <VStack spacing={4} align="stretch">
                {[
                  {
                    title: 'Server Components',
                    desc: 'Default to Server Components for data fetching. Only use Client Components when needed for interactivity (hooks, event handlers, browser APIs).',
                  },
                  {
                    title: 'API Routes',
                    desc: 'All API routes follow RESTful conventions and return consistent JSON responses with success/error structure.',
                  },
                  {
                    title: 'Middleware (Proxy)',
                    desc: 'Uses proxy.ts (not middleware.ts) for request interception, session management, and security headers.',
                  },
                  {
                    title: 'Error Handling',
                    desc: 'Comprehensive error handling with sanitization for client responses and detailed server-side logging.',
                  },
                  {
                    title: 'Security First',
                    desc: 'All operations include authentication checks, CSRF protection, rate limiting, input validation, and encryption.',
                  },
                ].map((pattern, index) => (
                  <Box key={pattern.title}>
                    <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                      {pattern.title}
                    </Heading>
                    <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                      {pattern.desc}
                    </Text>
                    {index < 4 && <Divider borderColor="surface.700" mt={4} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Data Flow */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Data Flow
              </Heading>
              <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px">
                <OrderedList spacing={2} color="surface.300" fontSize="sm" pl={4}>
                  <ListItem>User makes request → Proxy checks authentication</ListItem>
                  <ListItem>Request routed to API route or page component</ListItem>
                  <ListItem>API route validates input, checks rate limits, CSRF</ListItem>
                  <ListItem>Service layer handles business logic</ListItem>
                  <ListItem>Database operations via Supabase client (with RLS)</ListItem>
                  <ListItem>Response formatted and returned</ListItem>
                  <ListItem>Security events logged for monitoring</ListItem>
                </OrderedList>
              </Box>
            </CardBody>
          </Card>

          {/* Security Architecture */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Security Architecture
              </Heading>
              <VStack spacing={4} align="stretch">
                {[
                  {
                    title: 'Authentication',
                    desc: 'Supabase Auth handles user authentication. Sessions managed via secure cookies.',
                  },
                  {
                    title: 'Authorization',
                    desc: 'Row Level Security (RLS) ensures users can only access their own data. Admin access requires exact email match.',
                  },
                  {
                    title: 'Encryption',
                    desc: 'Database connection strings encrypted with AES-256-GCM before storage.',
                  },
                  {
                    title: 'Input Validation',
                    desc: 'All inputs validated using Zod schemas. SQL injection prevention via parameterized queries.',
                  },
                ].map((item, index) => (
                  <Box key={item.title}>
                    <Heading as="h3" size="sm" mb={2} color="white" fontWeight="600">
                      {item.title}
                    </Heading>
                    <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                      {item.desc}
                    </Text>
                    {index < 3 && <Divider borderColor="surface.700" mt={4} />}
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
