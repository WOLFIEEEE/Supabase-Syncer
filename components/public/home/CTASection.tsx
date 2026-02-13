'use client';

import Link from 'next/link';
import { Button } from '@chakra-ui/react';
import { CtaStrip, SectionShell } from '@/components/ui/layout-primitives';

export default function CTASection() {
  return (
    <SectionShell title="" py={{ base: 8, md: 12 }}>
      <CtaStrip
        title="Ready to replace brittle sync scripts?"
        description="Connect your databases, validate schema state, and run controlled synchronization with clear rollback options."
        actions={
          <>
            <Button as={Link} href="/login" size="lg">
              Open Dashboard
            </Button>
            <Button as={Link} href="/guide" variant="outline" size="lg">
              Read Technical Guide
            </Button>
          </>
        }
      />
    </SectionShell>
  );
}
