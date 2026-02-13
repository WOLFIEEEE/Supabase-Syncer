'use client';

import Link from 'next/link';
import { Badge, Box, Button, HStack, ListItem, Text, UnorderedList, VStack } from '@chakra-ui/react';
import { HeroShell } from '@/components/ui/layout-primitives';

const quickChecks = [
  'Bi-directional and one-way sync modes',
  'Production safety rails and schema drift checks',
  'Keep-alive automation for Supabase free tier',
  'Rollback-ready migration previews before writes',
];

export default function HeroSection() {
  return (
    <HeroShell
      label="Production-grade synchronization"
      title={
        <>
          Sync Supabase data
          <br />
          <Box as="span" className="text-gradient">
            without shipping risk
          </Box>
        </>
      }
      description="Move data between development, staging, and production with deterministic safeguards, clear status reporting, and schema-aware execution."
      actions={
        <>
          <Button as={Link} href="/login" size="lg" className="btn-glow">
            Start Syncing
          </Button>
          <Button as={Link} href="/getting-started" variant="outline" size="lg">
            Explore Quickstart
          </Button>
        </>
      }
      rightPane={
        <VStack align="start" spacing={4}>
          <Badge colorScheme="teal" variant="subtle">
            Live platform checks
          </Badge>
          <Text color="text.primary" fontSize="lg" fontWeight="600">
            All systems operational
          </Text>
          <HStack spacing={3} flexWrap="wrap">
            <Badge colorScheme="green">API Healthy</Badge>
            <Badge colorScheme="green">Queue Healthy</Badge>
            <Badge colorScheme="green">Realtime Online</Badge>
          </HStack>
          <UnorderedList spacing={2} color="text.secondary" pl={5}>
            {quickChecks.map((line) => (
              <ListItem key={line}>{line}</ListItem>
            ))}
          </UnorderedList>
        </VStack>
      }
    />
  );
}
