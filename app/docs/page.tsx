/**
 * Developer Documentation Hub
 * 
 * Main documentation page with navigation to all documentation sections
 */

'use client';

import Link from 'next/link';
import { Box, Container, Heading, Text, SimpleGrid, VStack, HStack, UnorderedList, ListItem, Flex } from '@chakra-ui/react';

export default function DocsPage() {
  const docSections = [
    {
      title: 'Getting Started',
      description: 'Quick start guide and installation instructions',
      href: '/docs/getting-started',
      icon: '🚀',
      color: 'blue.500'
    },
    {
      title: 'API Reference',
      description: 'Complete API endpoint documentation with examples',
      href: '/docs/api',
      icon: '📡',
      color: 'green.500'
    },
    {
      title: 'Database Schema',
      description: 'Database tables, relationships, and migrations',
      href: '/docs/database',
      icon: '🗄️',
      color: 'purple.500'
    },
    {
      title: 'Authentication',
      description: 'Auth flow, sessions, and security features',
      href: '/docs/authentication',
      icon: '🔐',
      color: 'red.500'
    },
    {
      title: 'Admin Features',
      description: 'Admin dashboard, logging, and monitoring',
      href: '/docs/admin',
      icon: '👨‍💼',
      color: 'orange.500'
    },
    {
      title: 'Architecture',
      description: 'System architecture and design patterns',
      href: '/docs/architecture',
      icon: '🏗️',
      color: 'indigo.500'
    },
    {
      title: 'Sync Operations',
      description: 'Database synchronization features and workflows',
      href: '/docs/sync',
      icon: '🔄',
      color: 'teal.500'
    },
    {
      title: 'Security',
      description: 'Security features, encryption, and best practices',
      href: '/docs/security',
      icon: '🛡️',
      color: 'pink.500'
    }
  ];

  return (
    <Box>
      <Container maxW="7xl" py={12}>
        {/* Header */}
        <VStack spacing={4} mb={12} textAlign="center">
          <Heading as="h1" size="2xl" color="white">
            Developer Documentation
          </Heading>
          <Text fontSize="xl" color="gray.300" maxW="3xl">
            Complete guide to Supabase Syncer API, features, and architecture.
            Everything you need to integrate and extend the platform.
          </Text>
        </VStack>

        {/* Documentation Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={12}>
          {docSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Box
                bg="surface.800"
                borderRadius="lg"
                boxShadow="md"
                p={6}
                border="1px solid"
                borderColor="surface.700"
                _hover={{
                  boxShadow: 'xl',
                  borderColor: 'surface.600',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }}
                transition="all 0.2s"
              >
                <Flex align="start" gap={4}>
                  <Box
                    bg={section.color}
                    color="white"
                    borderRadius="lg"
                    p={3}
                    fontSize="2xl"
                    flexShrink={0}
                  >
                    {section.icon}
                  </Box>
                  <Box flex={1}>
                    <Heading as="h2" size="md" mb={2} color="white" _groupHover={{ color: 'brand.400' }}>
                      {section.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.400">
                      {section.description}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Link>
          ))}
        </SimpleGrid>

        {/* Quick Links */}
        <Box bg="surface.800" borderRadius="lg" boxShadow="md" p={6} border="1px solid" borderColor="surface.700">
          <Heading as="h2" size="lg" mb={4} color="white">
            Quick Links
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Heading as="h3" size="sm" mb={2} color="white" fontWeight="medium">
                API Endpoints
              </Heading>
              <UnorderedList spacing={1} fontSize="sm" color="gray.300">
                <ListItem>
                  <Link href="/docs/api#health" style={{ color: 'inherit' }}>
                    <Text as="span" _hover={{ color: 'brand.400' }}>Health Check</Text>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="/docs/api#connections" style={{ color: 'inherit' }}>
                    <Text as="span" _hover={{ color: 'brand.400' }}>Connections API</Text>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="/docs/api#sync" style={{ color: 'inherit' }}>
                    <Text as="span" _hover={{ color: 'brand.400' }}>Sync Operations</Text>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="/docs/api#explorer" style={{ color: 'inherit' }}>
                    <Text as="span" _hover={{ color: 'brand.400' }}>Data Explorer</Text>
                  </Link>
                </ListItem>
              </UnorderedList>
            </Box>
            <Box>
              <Heading as="h3" size="sm" mb={2} color="white" fontWeight="medium">
                Resources
              </Heading>
              <UnorderedList spacing={1} fontSize="sm" color="gray.300">
                <ListItem>
                  <a href="/api/docs" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                    <Text as="span" _hover={{ color: 'brand.400' }}>API JSON Schema</Text>
                  </a>
                </ListItem>
                <ListItem>
                  <a href="https://github.com/WOLFIEEEE/Supabase-Syncer" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                    <Text as="span" _hover={{ color: 'brand.400' }}>GitHub Repository</Text>
                  </a>
                </ListItem>
                <ListItem>
                  <Link href="/docs/database#migrations" style={{ color: 'inherit' }}>
                    <Text as="span" _hover={{ color: 'brand.400' }}>Database Migrations</Text>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="/docs/security#encryption" style={{ color: 'inherit' }}>
                    <Text as="span" _hover={{ color: 'brand.400' }}>Encryption Guide</Text>
                  </Link>
                </ListItem>
              </UnorderedList>
            </Box>
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
}

