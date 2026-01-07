import type { Metadata } from 'next';
import BestPracticesPageClient from './BestPracticesPageClient';

export const metadata: Metadata = {
  title: 'Best Practices - suparbase | Tips & Recommendations',
  description: 'Learn best practices for using suparbase: connection management, sync strategy, schema management, security, and performance optimization.',
  keywords: ['supabase best practices', 'database sync tips', 'supabase optimization', 'database management practices'],
  openGraph: {
    title: 'Best Practices - suparbase',
    description: 'Tips and recommendations for optimal suparbase usage.',
    url: 'https://suparbase.com/best-practices',
    type: 'website',
  },
};

export default function BestPracticesPage() {
  return <BestPracticesPageClient />;
}



