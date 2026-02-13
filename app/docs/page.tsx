'use client';

import Link from 'next/link';
import { Badge, Box, Button, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';

function DocsCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Box as={Link} href={href} className="surface-panel hover-lift" p={{ base: 5, md: 6 }}>
      <VStack align="start" spacing={3}>
        <HStack justify="space-between" w="full">
          <Text fontSize="lg" fontWeight="600" color="text.primary">
            {title}
          </Text>
          {badge && (
            <Badge colorScheme="teal" fontSize="10px" px={2} py={0.5} borderRadius="full" textTransform="none">
              {badge}
            </Badge>
          )}
        </HStack>
        <Text textStyle="body">{description}</Text>
        <Text fontSize="sm" color="accent.primary" fontWeight="600">
          Open section →
        </Text>
      </VStack>
    </Box>
  );
}

export default function DocsPage() {
  return (
    <VStack align="stretch" spacing={10}>
      <Box>
        <Badge colorScheme="teal" mb={4} fontSize="xs" px={2} py={1} borderRadius="full">
          DOCUMENTATION
        </Badge>
        <Text textStyle="h1" color="text.primary" mb={4}>
          Build and operate sync workflows with confidence
        </Text>
        <Text textStyle="bodyLg" maxW="700px">
          This documentation covers architecture, API behavior, security safeguards, and operational guidance for
          production Supabase synchronization.
        </Text>
      </Box>

      <Box>
        <Text textStyle="label" color="text.tertiary" mb={4}>
          Start Here
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <DocsCard
            href="/docs/getting-started"
            title="Quickstart"
            description="Configure your first connection, verify schema, and run your first sync job."
            badge="Recommended"
          />
          <DocsCard
            href="/docs/api"
            title="API Reference"
            description="Endpoint contracts, request/response examples, and operational semantics."
          />
        </SimpleGrid>
      </Box>

      <Box>
        <Text textStyle="label" color="text.tertiary" mb={4}>
          Core Guides
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          <DocsCard href="/docs/database" title="Database Schema" description="Understand metadata extraction, table mapping, and relation handling." />
          <DocsCard href="/docs/sync" title="Sync Operations" description="Learn run modes, conflict strategy, and rollback-aware execution." />
          <DocsCard href="/docs/security" title="Security" description="CSRF, encryption, authentication checks, and audit controls." />
          <DocsCard href="/docs/authentication" title="Authentication" description="Session model, login flows, and protected route behavior." />
          <DocsCard href="/docs/admin" title="Admin Dashboard" description="Operational monitoring, diagnostics, and administrative controls." />
          <DocsCard href="/docs/architecture" title="Architecture" description="Understand system boundaries, backend services, and data flow." />
        </SimpleGrid>
      </Box>

      <Box className="surface-strip" p={{ base: 6, md: 7 }}>
        <VStack align="start" spacing={3}>
          <Text textStyle="h3">Need a quick operational check?</Text>
          <Text textStyle="body">
            Validate health endpoints and connection status from the dashboard before running large sync batches.
          </Text>
          <HStack spacing={3} flexWrap="wrap">
            <Button as={Link} href="/status" size="sm">
              View Status Page
            </Button>
            <Button as={Link} href="/docs/api#health" size="sm" variant="outline">
              Health API docs
            </Button>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  );
}
