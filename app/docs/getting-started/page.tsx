/**
 * Getting Started Documentation
 * 
 * Quick start guide for new users.
 */

'use client';

import Link from 'next/link';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Code,
  Divider,
  OrderedList,
  ListItem,
  UnorderedList,
} from '@chakra-ui/react';

// Step component
function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <HStack align="start" spacing={4}>
      <Box
        w={8}
        h={8}
        bg="teal.500"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Text fontSize="sm" fontWeight="700" color="white">
          {number}
        </Text>
      </Box>
      <Box flex={1}>
        <Text fontSize="lg" fontWeight="600" color="white" mb={2}>
          {title}
        </Text>
        <Box color="gray.400" fontSize="sm" lineHeight="1.8">
          {children}
        </Box>
      </Box>
    </HStack>
  );
}

// Code block component
function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <Box
      bg="rgba(0, 0, 0, 0.4)"
      borderRadius="md"
      p={4}
      overflowX="auto"
      fontSize="sm"
      fontFamily="mono"
      my={3}
    >
      <pre style={{ margin: 0, color: '#e2e8f0' }}>
        <code>{code}</code>
      </pre>
    </Box>
  );
}

// Info box component
function InfoBox({ type, children }: { type: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const colors = {
    info: { bg: 'blue.900', border: 'blue.500', icon: 'ℹ️' },
    warning: { bg: 'orange.900', border: 'orange.500', icon: '⚠️' },
    tip: { bg: 'green.900', border: 'green.500', icon: '💡' },
  };
  const { bg, border, icon } = colors[type];

  return (
    <Box
      bg={bg}
      borderLeft="4px solid"
      borderColor={border}
      p={4}
      borderRadius="md"
      my={4}
    >
      <HStack align="start" spacing={2}>
        <Text>{icon}</Text>
        <Box fontSize="sm" color="gray.200">
          {children}
        </Box>
      </HStack>
    </Box>
  );
}

export default function GettingStartedPage() {
  return (
    <VStack align="stretch" spacing={10}>
      {/* Header */}
      <Box>
        <Badge colorScheme="green" mb={4} fontSize="xs" px={2} py={1} borderRadius="full">
          QUICKSTART
        </Badge>
        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700" color="white" mb={3}>
          Getting Started
        </Text>
        <Text color="gray.400" lineHeight="1.7">
          Get up and running with Suparbase in under 5 minutes. This guide will walk you through 
          connecting your first database and starting a sync operation.
        </Text>
      </Box>

      {/* Prerequisites */}
      <Box>
        <Text fontSize="lg" fontWeight="600" color="white" mb={3}>
          Prerequisites
        </Text>
        <UnorderedList spacing={2} color="gray.400" pl={4}>
          <ListItem>A Supabase account and project</ListItem>
          <ListItem>PostgreSQL database URL(s) to connect</ListItem>
          <ListItem>Modern web browser (Chrome, Firefox, Safari, Edge)</ListItem>
        </UnorderedList>
      </Box>

      <Divider borderColor="gray.800" />

      {/* Steps */}
      <VStack align="stretch" spacing={8}>
        <Step number={1} title="Create an Account">
          <Text mb={3}>
            Sign up for Suparbase using your email or continue with your existing Supabase account.
          </Text>
          <Link href="/signup">
            <HStack
              spacing={1}
              color="teal.400"
              fontSize="sm"
              _hover={{ textDecoration: 'underline' }}
            >
              <Text>Create your account →</Text>
            </HStack>
          </Link>
        </Step>

        <Step number={2} title="Add Your First Connection">
          <Text mb={3}>
            Navigate to the Connections page and add your first database connection.
          </Text>
          <OrderedList spacing={2} pl={4} mb={4}>
            <ListItem>Click "Add Connection" in the dashboard</ListItem>
            <ListItem>Enter a name for your connection (e.g., "Production DB")</ListItem>
            <ListItem>Paste your PostgreSQL connection URL</ListItem>
            <ListItem>Select the environment (Production or Development)</ListItem>
            <ListItem>Click "Test Connection" to verify</ListItem>
          </OrderedList>
          <InfoBox type="tip">
            <Text>
              Your database URL should look like: <Code fontSize="xs">postgresql://user:password@host:5432/database</Code>
            </Text>
          </InfoBox>
          <InfoBox type="info">
            <Text>
              All connection URLs are encrypted with AES-256-GCM before storage. Your credentials are never stored in plain text.
            </Text>
          </InfoBox>
        </Step>

        <Step number={3} title="Enable Keep-Alive (Optional)">
          <Text mb={3}>
            If you're using Supabase's free tier, enable Keep-Alive to prevent your database from pausing due to inactivity.
          </Text>
          <OrderedList spacing={2} pl={4}>
            <ListItem>Go to your connection settings</ListItem>
            <ListItem>Toggle "Keep-Alive" to enabled</ListItem>
            <ListItem>Your database will be pinged automatically every day</ListItem>
          </OrderedList>
        </Step>

        <Step number={4} title="Create Your First Sync Job">
          <Text mb={3}>
            With two or more connections, you can create a sync job to synchronize data between databases.
          </Text>
          <OrderedList spacing={2} pl={4} mb={4}>
            <ListItem>Navigate to "Sync" → "Create New Sync"</ListItem>
            <ListItem>Select your source database</ListItem>
            <ListItem>Select your target database</ListItem>
            <ListItem>Choose the tables to sync</ListItem>
            <ListItem>Configure conflict resolution strategy</ListItem>
            <ListItem>Review and start the sync</ListItem>
          </OrderedList>
          <InfoBox type="warning">
            <Text>
              <strong>Production Safety:</strong> For production databases, you'll be asked to confirm operations. 
              We recommend testing with a development database first.
            </Text>
          </InfoBox>
        </Step>

        <Step number={5} title="Monitor Progress">
          <Text mb={3}>
            Watch your sync job progress in real-time with live updates.
          </Text>
          <UnorderedList spacing={2} pl={4}>
            <ListItem>View real-time progress for each table</ListItem>
            <ListItem>See row counts and processing speed</ListItem>
            <ListItem>Pause, resume, or stop the sync at any time</ListItem>
            <ListItem>Review detailed logs after completion</ListItem>
          </UnorderedList>
        </Step>
      </VStack>

      <Divider borderColor="gray.800" />

      {/* Environment Variables */}
      <Box>
        <Text fontSize="lg" fontWeight="600" color="white" mb={3}>
          Environment Variables (Self-Hosted)
        </Text>
        <Text color="gray.400" fontSize="sm" mb={4}>
          If you're self-hosting Suparbase, you'll need to configure these environment variables:
        </Text>
        <CodeBlock
          code={`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend Configuration
BACKEND_URL=https://your-backend.example.com
BACKEND_SHARED_SECRET=your_32_char_shared_secret

# Security
ENCRYPTION_KEY=your_64_hex_char_encryption_key

# Optional: Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx`}
        />
      </Box>

      {/* Next Steps */}
      <Box
        p={6}
        bg="rgba(255, 255, 255, 0.02)"
        border="1px solid"
        borderColor="gray.800"
        borderRadius="xl"
      >
        <Text fontSize="lg" fontWeight="600" color="white" mb={4}>
          Next Steps
        </Text>
        <VStack align="stretch" spacing={3}>
          <Link href="/docs/api">
            <HStack
              p={3}
              borderRadius="md"
              _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
              transition="background 0.2s"
            >
              <Box color="teal.400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </Box>
              <Box>
                <Text color="white" fontSize="sm" fontWeight="500">
                  API Reference
                </Text>
                <Text color="gray.500" fontSize="xs">
                  Explore the complete API documentation
                </Text>
              </Box>
            </HStack>
          </Link>
          <Link href="/docs/sync">
            <HStack
              p={3}
              borderRadius="md"
              _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
              transition="background 0.2s"
            >
              <Box color="teal.400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              </Box>
              <Box>
                <Text color="white" fontSize="sm" fontWeight="500">
                  Sync Operations
                </Text>
                <Text color="gray.500" fontSize="xs">
                  Deep dive into sync features and options
                </Text>
              </Box>
            </HStack>
          </Link>
          <Link href="/docs/security">
            <HStack
              p={3}
              borderRadius="md"
              _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
              transition="background 0.2s"
            >
              <Box color="teal.400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </Box>
              <Box>
                <Text color="white" fontSize="sm" fontWeight="500">
                  Security
                </Text>
                <Text color="gray.500" fontSize="xs">
                  Learn about encryption and security features
                </Text>
              </Box>
            </HStack>
          </Link>
        </VStack>
      </Box>
    </VStack>
  );
}
