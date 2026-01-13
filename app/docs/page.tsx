/**
 * Documentation Home Page
 * 
 * Beautiful landing page for the documentation with quick access cards.
 */

'use client';

import Link from 'next/link';
import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Badge,
  Flex,
} from '@chakra-ui/react';

// Card component for documentation sections
function DocCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link href={href}>
      <Box
        p={5}
        bg="rgba(255, 255, 255, 0.02)"
        border="1px solid"
        borderColor="gray.800"
        borderRadius="xl"
        _hover={{
          bg: 'rgba(255, 255, 255, 0.04)',
          borderColor: 'gray.700',
          transform: 'translateY(-2px)',
        }}
        transition="all 0.2s"
        h="full"
      >
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full">
            <Box
              p={2.5}
              bg="rgba(20, 184, 166, 0.1)"
              borderRadius="lg"
              color="teal.400"
            >
              {icon}
            </Box>
            {badge && (
              <Badge
                colorScheme="teal"
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                textTransform="none"
              >
                {badge}
              </Badge>
            )}
          </HStack>
          <Box>
            <Text fontSize="md" fontWeight="600" color="white" mb={1}>
              {title}
            </Text>
            <Text fontSize="sm" color="gray.400" lineHeight="1.6">
              {description}
            </Text>
          </Box>
          <HStack spacing={1} color="teal.400" fontSize="sm">
            <Text>Learn more</Text>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </HStack>
        </VStack>
      </Box>
    </Link>
  );
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <HStack align="start" spacing={4} p={4} bg="rgba(255, 255, 255, 0.02)" borderRadius="lg">
      <Box color="teal.400" flexShrink={0}>
        {icon}
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="600" color="white" mb={1}>
          {title}
        </Text>
        <Text fontSize="sm" color="gray.400">
          {description}
        </Text>
      </Box>
    </HStack>
  );
}

export default function DocsPage() {
  return (
    <VStack align="stretch" spacing={12}>
      {/* Hero Section */}
      <Box>
        <Badge colorScheme="teal" mb={4} fontSize="xs" px={2} py={1} borderRadius="full">
          DOCUMENTATION
        </Badge>
        <Text
          fontSize={{ base: '3xl', md: '4xl' }}
          fontWeight="700"
          color="white"
          lineHeight="1.2"
          mb={4}
        >
          Welcome to Suparman Docs
        </Text>
        <Text fontSize="lg" color="gray.400" maxW="600px" lineHeight="1.7">
          Add complete database synchronization and keep-alive functionality to your Supabase projects in minutes.
        </Text>
      </Box>

      {/* Quick Start Cards */}
      <Box>
        <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={4}>
          Quick Start
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <DocCard
            href="/docs/getting-started"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            }
            title="Quickstart Tutorial"
            description="Get up and running with Suparman in under 5 minutes. Connect your first database and start syncing."
            badge="Start here"
          />
          <DocCard
            href="/docs/api"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            }
            title="API Reference"
            description="Complete reference for all REST API endpoints with examples and response schemas."
          />
        </SimpleGrid>
      </Box>

      {/* Main Documentation Cards */}
      <Box>
        <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={4}>
          Explore the Docs
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          <DocCard
            href="/docs/database"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            }
            title="Database Schema"
            description="Learn about tables, relationships, and database structure."
          />
          <DocCard
            href="/docs/sync"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            }
            title="Sync Operations"
            description="Master database synchronization features and workflows."
          />
          <DocCard
            href="/docs/authentication"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
            title="Authentication"
            description="Secure authentication flows and session management."
          />
          <DocCard
            href="/docs/security"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Security"
            description="Encryption, CSRF protection, and security best practices."
          />
          <DocCard
            href="/docs/admin"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
            title="Admin Dashboard"
            description="User management, monitoring, and system administration."
          />
          <DocCard
            href="/docs/architecture"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            }
            title="Architecture"
            description="System design, data flow, and component overview."
          />
        </SimpleGrid>
      </Box>

      {/* Features Overview */}
      <Box>
        <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={4}>
          Key Features
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FeatureCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 12 15 22 5" />
              </svg>
            }
            title="AES-256 Encryption"
            description="Connection URLs are encrypted at rest using AES-256-GCM encryption."
          />
          <FeatureCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            }
            title="Real-time Sync"
            description="Server-Sent Events for live progress updates during sync operations."
          />
          <FeatureCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            title="Keep-Alive Service"
            description="Automated pings to prevent free-tier databases from pausing."
          />
          <FeatureCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Production Safeguards"
            description="Extra confirmations and dry-run mode for production operations."
          />
        </SimpleGrid>
      </Box>

      {/* API Status Section */}
      <Box
        p={6}
        bg="rgba(255, 255, 255, 0.02)"
        border="1px solid"
        borderColor="gray.800"
        borderRadius="xl"
      >
        <HStack justify="space-between" mb={4}>
          <Text fontSize="md" fontWeight="600" color="white">
            API Status
          </Text>
          <HStack spacing={2}>
            <Box w={2} h={2} bg="green.400" borderRadius="full" />
            <Text fontSize="sm" color="green.400">
              All Systems Operational
            </Text>
          </HStack>
        </HStack>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          {[
            { name: 'Health API', status: 'Operational' },
            { name: 'Connections API', status: 'Operational' },
            { name: 'Sync API', status: 'Operational' },
            { name: 'Explorer API', status: 'Operational' },
          ].map((api) => (
            <HStack key={api.name} spacing={2}>
              <Box w={1.5} h={1.5} bg="green.400" borderRadius="full" />
              <Text fontSize="sm" color="gray.400">
                {api.name}
              </Text>
            </HStack>
          ))}
        </SimpleGrid>
      </Box>

      {/* Help Section */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Box
          flex={1}
          p={5}
          bg="rgba(255, 255, 255, 0.02)"
          border="1px solid"
          borderColor="gray.800"
          borderRadius="xl"
        >
          <HStack spacing={3} mb={3}>
            <Box color="teal.400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </Box>
            <Text fontSize="md" fontWeight="600" color="white">
              GitHub Repository
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.400" mb={4}>
            Star us on GitHub, report issues, and contribute to the project.
          </Text>
          <a href="https://github.com/WOLFIEEEE/Supabase-Syncer" target="_blank" rel="noopener noreferrer">
            <HStack
              spacing={1}
              color="teal.400"
              fontSize="sm"
              _hover={{ textDecoration: 'underline' }}
            >
              <Text>View Repository</Text>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </HStack>
          </a>
        </Box>
        <Box
          flex={1}
          p={5}
          bg="rgba(255, 255, 255, 0.02)"
          border="1px solid"
          borderColor="gray.800"
          borderRadius="xl"
        >
          <HStack spacing={3} mb={3}>
            <Box color="teal.400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Box>
            <Text fontSize="md" fontWeight="600" color="white">
              Need Help?
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.400" mb={4}>
            Check our troubleshooting guide or open an issue on GitHub.
          </Text>
          <Link href="/troubleshooting">
            <HStack
              spacing={1}
              color="teal.400"
              fontSize="sm"
              _hover={{ textDecoration: 'underline' }}
            >
              <Text>Troubleshooting Guide</Text>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </HStack>
          </Link>
        </Box>
      </Flex>
    </VStack>
  );
}
