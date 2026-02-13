'use client';

import { Box, Grid, Text, VStack } from '@chakra-ui/react';
import { MetricPanel, SectionShell } from '@/components/ui/layout-primitives';

const metrics = [
  { label: 'Median sync runtime', value: '< 90s', helper: 'On typical staging datasets under 1M rows' },
  { label: 'Rollback confidence', value: '100%', helper: 'Preflight checks required before production writes' },
  { label: 'Schema drift catches', value: '24/7', helper: 'Continuous verification in guided workflows' },
  { label: 'Connection hardening', value: 'AES-256', helper: 'Encrypted connection URL storage by default' },
];

export default function SocialProofSection() {
  return (
    <SectionShell
      label="Built for teams"
      title="Reliable sync operations with observable outcomes"
      description="Use one opinionated workflow across environments instead of scripting fragile database handoffs."
      py={{ base: 8, md: 10 }}
    >
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }} gap={4}>
        {metrics.map((metric) => (
          <MetricPanel key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} />
        ))}
      </Grid>

      <Box className="surface-panel-muted" p={{ base: 5, md: 6 }}>
        <VStack align="start" spacing={3}>
          <Text textStyle="label" color="text.tertiary">
            Why this matters
          </Text>
          <Text textStyle="bodyLg">
            Most outages happen between environments, not inside one environment. Suparbase centralizes sync logic, schema checks,
            and connection health so shipping data changes is predictable.
          </Text>
        </VStack>
      </Box>
    </SectionShell>
  );
}
