/**
 * Documentation Layout
 * 
 * Provides consistent navigation and layout for all documentation pages
 */

'use client';

import Link from 'next/link';
import { Box, Flex, VStack, Heading, Container } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';

export default function DocsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
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
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="7xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <Flex direction={{ base: 'column', lg: 'row' }} gap={8}>
          {/* Sidebar Navigation */}
          <Box w={{ base: '100%', lg: '64' }} flexShrink={0}>
            <Box
              bg="surface.800"
              borderRadius="lg"
              boxShadow="md"
              p={4}
              position="sticky"
              top={8}
              borderColor="surface.700"
              borderWidth="1px"
            >
              <Heading as="h2" size="md" mb={4} color="white" fontFamily="'Outfit', sans-serif">
                Documentation
              </Heading>
              <VStack align="stretch" spacing={2}>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Box
                        px={3}
                        py={2}
                        borderRadius="md"
                        fontSize="sm"
                        color={isActive ? 'brand.400' : 'surface.300'}
                        bg={isActive ? 'brand.400/10' : 'transparent'}
                        borderWidth={isActive ? '1px' : '0'}
                        borderColor={isActive ? 'brand.400/30' : 'transparent'}
                        _hover={{
                          bg: isActive ? 'brand.400/10' : 'surface.700',
                          color: 'brand.400',
                          borderColor: isActive ? 'brand.400/30' : 'surface.600'
                        }}
                        transition="all 0.2s"
                        fontWeight={isActive ? '600' : '400'}
                      >
                        {item.label}
                      </Box>
                    </Link>
                  );
                })}
              </VStack>
            </Box>
          </Box>

          {/* Main Content */}
          <Box flex={1} minW={0}>
            {children}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

