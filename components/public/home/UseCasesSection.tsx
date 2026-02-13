'use client';

import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { FeatureGrid, SectionShell } from '@/components/ui/layout-primitives';

const useCases = [
  {
    title: 'Startups shipping fast',
    summary: 'Standardize staging-to-production data updates without introducing custom ops burden.',
  },
  {
    title: 'Agencies managing clients',
    summary: 'Use one repeatable sync and schema validation process across multiple Supabase projects.',
  },
  {
    title: 'Enterprise platform teams',
    summary: 'Add governance and observability controls around high-impact synchronization jobs.',
  },
];

export default function UseCasesSection() {
  return (
    <SectionShell
      label="Use cases"
      title="Designed for teams that care about execution quality"
      description="From solo founders to regulated organizations, the workflow remains consistent and auditable."
      py={{ base: 8, md: 12 }}
    >
      <FeatureGrid columns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}>
        {useCases.map((useCase) => (
          <Box key={useCase.title} className="surface-panel-muted hover-lift" p={{ base: 5, md: 6 }}>
            <VStack align="start" spacing={3}>
              <Heading textStyle="h3">{useCase.title}</Heading>
              <Text textStyle="body">{useCase.summary}</Text>
            </VStack>
          </Box>
        ))}
      </FeatureGrid>
    </SectionShell>
  );
}
