'use client';

import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { FeatureGrid, SectionShell } from '@/components/ui/layout-primitives';

const features = [
  {
    title: 'One-click environment sync',
    description: 'Push controlled updates between development, staging, and production while preserving referential integrity.',
  },
  {
    title: 'Schema diff intelligence',
    description: 'Inspect schema drift before jobs run and generate migration guidance directly from discovered deltas.',
  },
  {
    title: 'Keep-alive automation',
    description: 'Prevent free-tier pause states with scheduled health pings and clear execution telemetry.',
  },
  {
    title: 'Secure credentials model',
    description: 'Connection URLs are encrypted at rest and guarded behind authenticated API boundaries.',
  },
  {
    title: 'Operational visibility',
    description: 'Track sync progress, failure points, and throughput with status-first dashboard surfaces.',
  },
  {
    title: 'Admin governance',
    description: 'Control access, monitor security signals, and run platform diagnostics from one admin interface.',
  },
];

export default function FeaturesSection() {
  return (
    <SectionShell
      label="Platform capabilities"
      title="Everything required to ship data changes confidently"
      description="Feature coverage is organized for developers, operators, and admin owners in a single workflow."
    >
      <FeatureGrid>
        {features.map((feature) => (
          <Box key={feature.title} className="surface-panel interactive-card" p={{ base: 5, md: 6 }}>
            <VStack align="start" spacing={3}>
              <Heading textStyle="h3">{feature.title}</Heading>
              <Text textStyle="body">{feature.description}</Text>
            </VStack>
          </Box>
        ))}
      </FeatureGrid>
    </SectionShell>
  );
}
