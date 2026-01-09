/**
 * Documentation Layout
 * 
 * Provides consistent navigation and layout for all documentation pages
 */

'use client';

import Link from 'next/link';
import { Box, Flex, VStack, Heading, List, ListItem } from '@chakra-ui/react';

export default function DocsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/docs', label: 'Overview' },
    { href: '/docs/getting-started', label: 'Getting Started' },
    { href: '/docs/api', label: 'API Reference' },
    { href: '/docs/database', label: 'Database' },
    { href: '/docs/authentication', label: 'Authentication' },
    { href: '/docs/admin', label: 'Admin' },
    { href: '/docs/architecture', label: 'Architecture' },
    { href: '/docs/sync', label: 'Sync Operations' },
    { href: '/docs/security', label: 'Security' },
  ];

  return (
    <Box minH="100vh" bg="surface.900" color="white">
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
        <Flex direction={{ base: 'column', lg: 'row' }} gap={8} py={8}>
          {/* Sidebar Navigation */}
          <Box w={{ base: '100%', lg: '64' }} flexShrink={0}>
            <Box
              bg="surface.800"
              borderRadius="lg"
              boxShadow="md"
              p={4}
              position="sticky"
              top={8}
            >
              <Heading as="h2" size="md" mb={4} color="white">
                Documentation
              </Heading>
              <VStack align="stretch" spacing={2}>
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Box
                      px={3}
                      py={2}
                      borderRadius="md"
                      fontSize="sm"
                      color="gray.300"
                      _hover={{
                        bg: 'surface.700',
                        color: 'brand.400'
                      }}
                      transition="all 0.2s"
                    >
                      {item.label}
                    </Box>
                  </Link>
                ))}
              </VStack>
            </Box>
          </Box>

          {/* Main Content */}
          <Box flex={1} minW={0}>
            {children}
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}

