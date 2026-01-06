import type { Metadata } from 'next';
import HowItWorksPageClient from './HowItWorksPageClient';

export const metadata: Metadata = {
  title: 'How It Works - suparbase | Database Sync Process Explained',
  description: 'Learn how suparbase synchronizes Supabase databases. Visual explanation of the sync process, architecture, security, and keep-alive mechanism.',
  keywords: ['how database sync works', 'supabase sync process', 'database synchronization', 'schema validation', 'keep-alive mechanism'],
  openGraph: {
    title: 'How It Works - suparbase',
    description: 'Visual explanation of how suparbase synchronizes databases and keeps them alive.',
    url: 'https://suparbase.com/how-it-works',
    type: 'website',
  },
};

export default function HowItWorksPage() {
  return <HowItWorksPageClient />;
}


