import type { Metadata } from 'next';
import UseCasesPageClient from './UseCasesPageClient';

export const metadata: Metadata = {
  title: 'Use Cases - suparbase | Real-World Scenarios',
  description: 'Discover how suparbase helps indie developers, startups, and teams manage Supabase databases. See real-world use cases and scenarios.',
  keywords: ['supabase use cases', 'database sync scenarios', 'supabase tools', 'database management', 'devops tools'],
  openGraph: {
    title: 'Use Cases - suparbase',
    description: 'Real-world scenarios where suparbase solves database synchronization problems.',
    url: 'https://suparbase.com/use-cases',
    type: 'website',
  },
};

export default function UseCasesPage() {
  return <UseCasesPageClient />;
}



