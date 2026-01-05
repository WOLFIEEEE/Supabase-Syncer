'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export default function AboutPageClient() {
  const router = useRouter();

  const values = [
    {
      icon: DatabaseIcon,
      title: 'Database-First',
      description: 'Built specifically for Supabase and PostgreSQL databases, understanding their unique requirements.',
    },
    {
      icon: ShieldIcon,
      title: 'Security & Privacy',
      description: 'Your database credentials are encrypted with AES-256-GCM. We never store your actual data.',
    },
    {
      icon: CodeIcon,
      title: 'Open Source',
      description: 'Fully open-source and transparent. Contribute, fork, or customize to fit your needs.',
    },
  ];

  return (
    <Box minH="100vh">
      <Container maxW="6xl" py={{ base: 8, md: 12 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              fontFamily="mono"
              bgGradient="linear(to-r, brand.300, brand.500)"
              bgClip="text"
            >
              About suparbase
            </Heading>
            <Text color="surface.400" fontSize={{ base: 'md', md: 'lg' }} maxW="2xl">
              We're building tools to make Supabase database management easier, safer, and more efficient.
            </Text>
          </VStack>

          <Divider borderColor="surface.700" />

          {/* Mission */}
          <VStack spacing={4} align="stretch">
            <Heading size="lg" color="white">
              Our Mission
            </Heading>
            <Text color="surface.400" fontSize="md" lineHeight="tall">
              suparbase was created to solve real problems faced by developers working with Supabase databases. 
              Whether you're syncing data between environments, preventing free tier pausing, or managing schema 
              migrations, we provide the tools you need to work confidently with your databases.
            </Text>
            <Text color="surface.400" fontSize="md" lineHeight="tall">
              We believe in open-source software, transparency, and putting developers first. Every feature we 
              build is designed with your workflow in mind, ensuring that database management doesn't get in the 
              way of building great applications.
            </Text>
          </VStack>

          {/* Values */}
          <VStack spacing={6} align="stretch">
            <Heading size="lg" color="white">
              Our Values
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {values.map((value, index) => (
                <Card key={index} bg="surface.800" borderColor="surface.700" borderWidth="1px">
                  <CardBody>
                    <VStack spacing={4} align="start">
                      <Box color="brand.400">
                        <value.icon />
                      </Box>
                      <Heading size="md" color="white">
                        {value.title}
                      </Heading>
                      <Text color="surface.400" fontSize="sm">
                        {value.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>

          {/* What We Do */}
          <VStack spacing={4} align="stretch">
            <Heading size="lg" color="white">
              What We Do
            </Heading>
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="md" color="brand.400" mb={2}>
                  Database Synchronization
                </Heading>
                <Text color="surface.400" fontSize="md">
                  Sync data between production and development databases with confidence. Our tools validate 
                  schema compatibility and provide safety checks before any data transfer.
                </Text>
              </Box>
              <Box>
                <Heading size="md" color="brand.400" mb={2}>
                  Keep-Alive Service
                </Heading>
                <Text color="surface.400" fontSize="md">
                  Prevent your Supabase free tier databases from pausing due to inactivity. Automated health 
                  checks keep your databases active and accessible.
                </Text>
              </Box>
              <Box>
                <Heading size="md" color="brand.400" mb={2}>
                  Schema Management
                </Heading>
                <Text color="surface.400" fontSize="md">
                  Compare schemas, detect differences, and generate migration scripts automatically. Ensure 
                  your database structures stay in sync across environments.
                </Text>
              </Box>
            </VStack>
          </VStack>

          {/* CTA */}
          <Box
            bg="surface.800"
            p={8}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="surface.700"
            textAlign="center"
          >
            <VStack spacing={4}>
              <Heading size="md" color="white">
                Ready to get started?
              </Heading>
              <Text color="surface.400">
                Join developers who are already using suparbase to manage their Supabase databases.
              </Text>
              <HStack spacing={4} justify="center">
                <Button
                  colorScheme="teal"
                  onClick={() => router.push('/signup')}
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/guide')}
                >
                  Read the Guide
                </Button>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

