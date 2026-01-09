/**
 * Developer Documentation Hub
 * 
 * Main documentation page with navigation to all documentation sections
 */

'use client';

import Link from 'next/link';
import { Box, Container, Heading, Text, SimpleGrid, VStack, HStack, UnorderedList, ListItem, Flex, Card, CardBody, Badge, Icon } from '@chakra-ui/react';
import {
  GettingStartedIcon,
  ApiIcon,
  DatabaseIcon,
  AuthIcon,
  AdminIcon,
  ArchitectureIcon,
  SyncIcon,
  SecurityIcon,
  BookIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
} from '@/components/docs/DocsIcons';

export default function DocsPage() {
  const docSections = [
    {
      title: 'Getting Started',
      description: 'Quick start guide and installation instructions',
      href: '/docs/getting-started',
      icon: GettingStartedIcon,
      color: 'blue.500',
      gradient: 'linear(to-br, blue.500, blue.600)'
    },
    {
      title: 'API Reference',
      description: 'Complete API endpoint documentation with examples',
      href: '/docs/api',
      icon: ApiIcon,
      color: 'green.500',
      gradient: 'linear(to-br, green.500, green.600)'
    },
    {
      title: 'Database Schema',
      description: 'Database tables, relationships, and migrations',
      href: '/docs/database',
      icon: DatabaseIcon,
      color: 'purple.500',
      gradient: 'linear(to-br, purple.500, purple.600)'
    },
    {
      title: 'Authentication',
      description: 'Auth flow, sessions, and security features',
      href: '/docs/authentication',
      icon: AuthIcon,
      color: 'red.500',
      gradient: 'linear(to-br, red.500, red.600)'
    },
    {
      title: 'Admin Features',
      description: 'Admin dashboard, logging, and monitoring',
      href: '/docs/admin',
      icon: AdminIcon,
      color: 'orange.500',
      gradient: 'linear(to-br, orange.500, orange.600)'
    },
    {
      title: 'Architecture',
      description: 'System architecture and design patterns',
      href: '/docs/architecture',
      icon: ArchitectureIcon,
      color: 'indigo.500',
      gradient: 'linear(to-br, indigo.500, indigo.600)'
    },
    {
      title: 'Sync Operations',
      description: 'Database synchronization features and workflows',
      href: '/docs/sync',
      icon: SyncIcon,
      color: 'teal.500',
      gradient: 'linear(to-br, teal.500, teal.600)'
    },
    {
      title: 'Security',
      description: 'Security features, encryption, and best practices',
      href: '/docs/security',
      icon: SecurityIcon,
      color: 'pink.500',
      gradient: 'linear(to-br, pink.500, pink.600)'
    }
  ];

  return (
    <Box minH="100vh">
      <Container maxW="7xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        {/* Header */}
        <VStack spacing={6} mb={16} textAlign="center">
          <HStack spacing={3}>
            <Icon as={BookIcon} w={8} h={8} color="brand.400" />
            <Badge colorScheme="teal" px={4} py={1} borderRadius="full" fontSize="sm" fontWeight="600">
              DOCUMENTATION
            </Badge>
          </HStack>
          <Heading
            as="h1"
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="700"
            color="white"
            fontFamily="'Outfit', sans-serif"
            letterSpacing="-0.02em"
            lineHeight="1.1"
          >
            Developer <Text as="span" color="brand.400">Documentation</Text>
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }} color="surface.400" maxW="3xl" lineHeight="1.6">
            Complete guide to Supabase Syncer API, features, and architecture.
            Everything you need to integrate and extend the platform.
          </Text>
        </VStack>

        {/* Documentation Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={16}>
          {docSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card
                  bg="surface.800"
                  borderColor="surface.700"
                  borderWidth="1px"
                  _hover={{
                    borderColor: section.color,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 10px 30px -5px ${section.color}20`,
                  }}
                  transition="all 0.3s ease"
                  h="100%"
                  cursor="pointer"
                >
                  <CardBody p={6}>
                    <VStack align="start" spacing={4}>
                      <Box
                        bgGradient={section.gradient}
                        color="white"
                        borderRadius="xl"
                        p={4}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow={`0 4px 14px 0 ${section.color}40`}
                      >
                        <Icon as={IconComponent} w={6} h={6} />
                      </Box>
                      <Box flex={1} w="100%">
                        <Heading as="h2" size="md" mb={2} color="white" fontWeight="600">
                          {section.title}
                        </Heading>
                        <Text fontSize="sm" color="surface.400" lineHeight="1.6">
                          {section.description}
                        </Text>
                      </Box>
                      <HStack spacing={1} color={section.color} fontSize="sm" fontWeight="500">
                        <Text>Learn more</Text>
                        <Icon as={ArrowRightIcon} w={4} h={4} />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </SimpleGrid>

        {/* Quick Links */}
        <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
          <CardBody p={8}>
            <VStack align="start" spacing={6}>
              <Heading as="h2" size="lg" color="white" fontWeight="600">
                Quick Links
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
                <VStack align="start" spacing={3}>
                  <Heading as="h3" size="sm" color="white" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" fontSize="xs">
                    API Endpoints
                  </Heading>
                  <VStack align="stretch" spacing={2} w="100%">
                    {[
                      { label: 'Health Check', href: '/docs/api#health' },
                      { label: 'Connections API', href: '/docs/api#connections' },
                      { label: 'Sync Operations', href: '/docs/api#sync' },
                      { label: 'Data Explorer', href: '/docs/api#explorer' },
                    ].map((link) => (
                      <Link key={link.href} href={link.href}>
                        <HStack
                          spacing={2}
                          p={2}
                          borderRadius="md"
                          _hover={{ bg: 'surface.700', color: 'brand.400' }}
                          transition="all 0.2s"
                          color="surface.300"
                        >
                          <Text fontSize="sm">{link.label}</Text>
                          <Icon as={ArrowRightIcon} w={3} h={3} />
                        </HStack>
                      </Link>
                    ))}
                  </VStack>
                </VStack>
                <VStack align="start" spacing={3}>
                  <Heading as="h3" size="sm" color="white" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" fontSize="xs">
                    Resources
                  </Heading>
                  <VStack align="stretch" spacing={2} w="100%">
                    {[
                      { label: 'API JSON Schema', href: '/api/docs', external: true },
                      { label: 'GitHub Repository', href: 'https://github.com/WOLFIEEEE/Supabase-Syncer', external: true },
                      { label: 'Database Migrations', href: '/docs/database#migrations' },
                      { label: 'Encryption Guide', href: '/docs/security#encryption' },
                    ].map((link) => {
                      const content = (
                        <HStack
                          spacing={2}
                          p={2}
                          borderRadius="md"
                          _hover={{ bg: 'surface.700', color: 'brand.400' }}
                          transition="all 0.2s"
                          color="surface.300"
                        >
                          <Text fontSize="sm">{link.label}</Text>
                          {link.external ? (
                            <Icon as={ExternalLinkIcon} w={3} h={3} />
                          ) : (
                            <Icon as={ArrowRightIcon} w={3} h={3} />
                          )}
                        </HStack>
                      );

                      return link.external ? (
                        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                          {content}
                        </a>
                      ) : (
                        <Link key={link.href} href={link.href}>
                          {content}
                        </Link>
                      );
                    })}
                  </VStack>
                </VStack>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}

