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
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Divider,
} from '@chakra-ui/react';

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const SyncIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const features = [
  {
    icon: SyncIcon,
    title: 'One-Click Database Sync',
    description: 'Synchronize data between production and development databases with a single click. Supports one-way sync with UPSERT operations for safe data migration.',
    category: 'core',
  },
  {
    icon: ShieldIcon,
    title: 'Schema Validation',
    description: 'Automatic schema comparison with critical issue detection before any sync. Identifies breaking changes, type mismatches, and missing columns.',
    category: 'core',
  },
  {
    icon: CodeIcon,
    title: 'Migration Generator',
    description: 'Auto-generate idempotent SQL scripts to fix schema differences automatically. Handles tables, columns, indexes, constraints, and ENUM types.',
    category: 'core',
  },
  {
    icon: ZapIcon,
    title: 'Real-time Execution',
    description: 'Execute migrations directly from the UI with production safety confirmations. Real-time progress tracking and detailed logging.',
    category: 'core',
  },
  {
    icon: DatabaseIcon,
    title: 'Keep-Alive Service',
    description: 'Prevent Supabase free tier databases from pausing due to inactivity with automated daily health checks. Keep your databases active 24/7.',
    category: 'monitoring',
  },
  {
    icon: ShieldIcon,
    title: 'Encrypted Storage',
    description: 'Database connection strings encrypted with AES-256-GCM before storage. Your credentials are never stored in plain text.',
    category: 'security',
  },
  {
    icon: ShieldIcon,
    title: 'Production Safeguards',
    description: 'Extra confirmation required when modifying production databases. Dry-run previews and breaking change warnings protect your data.',
    category: 'security',
  },
  {
    icon: DatabaseIcon,
    title: 'Schema Comparison',
    description: 'Compare table structures, columns, indexes, constraints, and ENUM types between databases. Detailed difference reports with severity levels.',
    category: 'core',
  },
  {
    icon: DatabaseIcon,
    title: 'Data Explorer',
    description: 'Browse and manage database tables with read/write operations. Clean admin dashboard interface for viewing and editing records.',
    category: 'core',
  },
  {
    icon: ZapIcon,
    title: 'Sync Job Monitoring',
    description: 'Real-time progress tracking, detailed logging, and status updates for ongoing synchronization tasks. Monitor sync speed, ETA, and errors.',
    category: 'monitoring',
  },
];

export default function FeaturesPageClient() {
  const router = useRouter();

  // Structured Data (JSON-LD)
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'suparbase Features',
    description: 'Complete list of features available in suparbase database synchronization tool',
    itemListElement: features.map((feature, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareFeature',
        name: feature.title,
        description: feature.description,
      },
    })),
  };

  return (
    <Box minH="100vh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Container maxW="6xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <HStack spacing={4}>
            <Button
              variant="ghost"
              leftIcon={<HomeIcon />}
              onClick={() => router.push('/')}
              size="sm"
            >
              Home
            </Button>
          </HStack>

          <VStack spacing={4} textAlign="center">
            <Heading as="h1" size="2xl" color="white">
              Features
            </Heading>
            <Text color="surface.400" fontSize="lg" maxW="2xl">
              Everything you need to synchronize and manage your Supabase databases
            </Text>
          </VStack>

          <Divider borderColor="surface.700" />

          {/* Features Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {features.map((feature) => (
              <Card key={feature.title} bg="surface.800" borderColor="surface.700" h="100%">
                <CardBody>
                  <VStack spacing={4} align="start">
                    <HStack spacing={3}>
                      <Box color="brand.400">
                        <feature.icon />
                      </Box>
                      <Badge
                        colorScheme={
                          feature.category === 'core'
                            ? 'teal'
                            : feature.category === 'security'
                            ? 'red'
                            : 'blue'
                        }
                        fontSize="xs"
                      >
                        {feature.category}
                      </Badge>
                    </HStack>
                    <VStack spacing={2} align="start">
                      <Heading as="h3" size="md" color="white">
                        {feature.title}
                      </Heading>
                      <Text color="surface.400" fontSize="sm" lineHeight="tall">
                        {feature.description}
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* CTA Section */}
          <Card bg="surface.800" borderColor="brand.500" borderWidth="2px">
            <CardBody p={8} textAlign="center">
              <VStack spacing={4}>
                <Heading as="h2" size="lg" color="white">
                  Ready to Get Started?
                </Heading>
                <Text color="surface.400" maxW="lg">
                  Start synchronizing your databases today. No credit card required.
                </Text>
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <Button
                    size="lg"
                    colorScheme="teal"
                    onClick={() => router.push('/signup')}
                    minH="48px"
                  >
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/getting-started')}
                    minH="48px"
                  >
                    Quick Start
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/use-cases')}
                    minH="48px"
                  >
                    See Use Cases
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

