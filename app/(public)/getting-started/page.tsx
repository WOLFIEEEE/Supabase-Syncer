import type { Metadata } from 'next';
import GettingStartedPageClient from './GettingStartedPageClient';

export const metadata: Metadata = {
  title: 'Getting Started - suparbase | Quick Start Guide',
  description: 'Step-by-step guide to get started with suparbase. Learn how to create an account, add connections, and sync your first database.',
  keywords: ['supabase getting started', 'database sync tutorial', 'supabase setup', 'quick start guide', 'onboarding'],
  openGraph: {
    title: 'Getting Started - suparbase',
    description: 'Quick start guide to begin syncing your Supabase databases.',
    url: 'https://suparbase.com/getting-started',
    type: 'website',
  },
};

export default function GettingStartedPage() {
  return <GettingStartedPageClient />;
}



