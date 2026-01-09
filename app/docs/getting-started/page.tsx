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
  Link,
  Divider,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { GettingStartedIcon, ArrowRightIcon } from '@/components/docs/DocsIcons';

export default function GettingStartedPage() {
  return (
    <Box minH="100vh">
      <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Icon as={GettingStartedIcon} w={8} h={8} color="blue.400" />
              <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
                QUICK START
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
              Getting Started
            </Heading>
            <Text fontSize="lg" color="surface.400" lineHeight="1.6">
              Get up and running with Supabase Syncer in under 5 minutes.
            </Text>
          </VStack>

          {/* Prerequisites */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Prerequisites
              </Heading>
              <UnorderedList spacing={2} color="surface.300" fontSize="md">
                <ListItem>Node.js 20.9.0 or higher</ListItem>
                <ListItem>npm or yarn package manager</ListItem>
                <ListItem>A Supabase account and project</ListItem>
                <ListItem>PostgreSQL databases to sync (Supabase or standard PostgreSQL)</ListItem>
              </UnorderedList>
            </CardBody>
          </Card>

          {/* Installation Steps */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Installation
              </Heading>
              <VStack spacing={6} align="stretch">
                <Box>
                  <HStack spacing={2} mb={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs">
                      1
                    </Badge>
                    <Heading as="h3" size="sm" color="white" fontWeight="600">
                      Clone the Repository
                    </Heading>
                  </HStack>
                  <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px">
                    <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="sm">
{`git clone https://github.com/WOLFIEEEE/Supabase-Syncer.git
cd Supabase-Syncer`}
                    </Code>
                  </Box>
                </Box>

                <Divider borderColor="surface.700" />

                <Box>
                  <HStack spacing={2} mb={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs">
                      2
                    </Badge>
                    <Heading as="h3" size="sm" color="white" fontWeight="600">
                      Install Dependencies
                    </Heading>
                  </HStack>
                  <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px">
                    <Code colorScheme="blue" display="block" fontSize="sm">
                      npm install
                    </Code>
                  </Box>
                </Box>

                <Divider borderColor="surface.700" />

                <Box>
                  <HStack spacing={2} mb={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs">
                      3
                    </Badge>
                    <Heading as="h3" size="sm" color="white" fontWeight="600">
                      Set Up Environment Variables
                    </Heading>
                  </HStack>
                  <Text fontSize="sm" color="surface.400" mb={3}>
                    Create a <Code fontSize="xs">.env.local</Code> file:
                  </Text>
                  <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" overflowX="auto">
                    <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_connection_string
ADMIN_EMAIL=your_admin_email@example.com`}
                    </Code>
                  </Box>
                </Box>

                <Divider borderColor="surface.700" />

                <Box>
                  <HStack spacing={2} mb={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs">
                      4
                    </Badge>
                    <Heading as="h3" size="sm" color="white" fontWeight="600">
                      Run Database Migrations
                    </Heading>
                  </HStack>
                  <Text fontSize="sm" color="surface.400" mb={3}>
                    Run the migration script in your Supabase SQL Editor:
                  </Text>
                  <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px">
                    <Code colorScheme="blue" display="block" whiteSpace="pre" fontSize="xs">
{`# Copy contents of supabase/migrations/009_ensure_all_tables_and_columns.sql
# and run in Supabase SQL Editor`}
                    </Code>
                  </Box>
                </Box>

                <Divider borderColor="surface.700" />

                <Box>
                  <HStack spacing={2} mb={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs">
                      5
                    </Badge>
                    <Heading as="h3" size="sm" color="white" fontWeight="600">
                      Start Development Server
                    </Heading>
                  </HStack>
                  <Box bg="surface.900" borderRadius="md" p={4} borderColor="surface.700" borderWidth="1px" mb={3}>
                    <Code colorScheme="blue" display="block" fontSize="sm">
                      npm run dev
                    </Code>
                  </Box>
                  <Text fontSize="sm" color="surface.400">
                    Open <Link href="http://localhost:3000" color="brand.400" isExternal>http://localhost:3000</Link>
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Start Guide */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={6} color="white" fontWeight="600">
                Quick Start Guide
              </Heading>
              <VStack spacing={6} align="stretch">
                {[
                  {
                    step: '1',
                    title: 'Create Your First Connection',
                    description:
                      'Navigate to /connections and add a database connection. Your connection string will be encrypted before storage.',
                  },
                  {
                    step: '2',
                    title: 'Test the Connection',
                    description: 'Use the test connection feature to verify your database is accessible.',
                  },
                  {
                    step: '3',
                    title: 'Create a Sync Job',
                    description:
                      'Go to /sync/create and set up a sync between two databases. You can choose which tables to sync and configure conflict resolution.',
                  },
                  {
                    step: '4',
                    title: 'Validate Schema',
                    description:
                      'Before syncing, validate that schemas are compatible. The system will detect any issues and suggest fixes.',
                  },
                  {
                    step: '5',
                    title: 'Start Syncing',
                    description: 'Once validated, start your sync job. Monitor progress in real-time and view detailed logs.',
                  },
                ].map((item, index) => (
                  <Box key={item.step}>
                    <HStack spacing={3} mb={2}>
                      <Badge colorScheme="teal" borderRadius="full" px={2.5} py={0.5} fontSize="xs" fontWeight="600">
                        {item.step}
                      </Badge>
                      <Heading as="h3" size="sm" color="white" fontWeight="600">
                        {item.title}
                      </Heading>
                    </HStack>
                    <Text fontSize="sm" color="surface.400" pl={10} lineHeight="1.6">
                      {item.description}
                    </Text>
                    {index < 4 && <Divider borderColor="surface.700" mt={4} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Next Steps */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <CardBody p={6}>
              <Heading as="h2" size="md" mb={4} color="white" fontWeight="600">
                Next Steps
              </Heading>
              <UnorderedList spacing={3} color="surface.300">
                <ListItem>
                  <Link href="/docs/api" color="brand.400" _hover={{ color: 'brand.300' }}>
                    Read the API Reference
                  </Link>{' '}
                  for programmatic access
                </ListItem>
                <ListItem>
                  <Link href="/docs/database" color="brand.400" _hover={{ color: 'brand.300' }}>
                    Explore Database Schema
                  </Link>{' '}
                  documentation
                </ListItem>
                <ListItem>
                  <Link href="/docs/authentication" color="brand.400" _hover={{ color: 'brand.300' }}>
                    Learn about Authentication
                  </Link>{' '}
                  and security
                </ListItem>
                <ListItem>
                  <Link href="/docs/architecture" color="brand.400" _hover={{ color: 'brand.300' }}>
                    Check out Architecture
                  </Link>{' '}
                  overview
                </ListItem>
              </UnorderedList>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
