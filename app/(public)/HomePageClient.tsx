'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@chakra-ui/react';
import { useAuth } from '@/lib/supabase/auth-context';
import HeroSection from '@/components/public/home/HeroSection';
import SocialProofSection from '@/components/public/home/SocialProofSection';
import FeaturesSection from '@/components/public/home/FeaturesSection';
import UseCasesSection from '@/components/public/home/UseCasesSection';
import CTASection from '@/components/public/home/CTASection';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'suparbase',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'Open-source tool to sync Supabase databases between environments with keep-alive automation and schema validation.',
  url: 'https://suparbase.com',
  author: {
    '@type': 'Organization',
    name: 'suparbase',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'suparbase',
  url: 'https://suparbase.com',
  description: 'Sync Supabase databases between environments with production safety controls.',
};

export default function HomePageClient() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, router, user]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <Box as="main" minH="100vh" className="gradient-mesh">
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <UseCasesSection />
        <CTASection />
      </Box>
    </>
  );
}
