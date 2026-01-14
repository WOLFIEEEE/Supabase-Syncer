import type { Metadata } from 'next';
import ComparisonPageClient from './ComparisonPageClient';

export const metadata: Metadata = {
  title: 'Comparison | suparbase vs Alternatives - Database Sync Tools',
  description: 'Compare suparbase with other database synchronization and keep-alive tools. See how we stack up against alternatives for Supabase database management.',
  keywords: [
    'supabase sync comparison',
    'database sync tools',
    'supabase vs alternatives',
    'database keep-alive tools',
    'postgres sync comparison',
    'database management tools',
    'supabase tools comparison',
  ],
  openGraph: {
    title: 'Comparison | suparbase vs Alternatives - Database Sync Tools',
    description: 'Compare suparbase with other database synchronization and keep-alive tools. See how we stack up against alternatives.',
    url: 'https://suparbase.com/comparison',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Comparison',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comparison | suparbase vs Alternatives - Database Sync Tools',
    description: 'Compare suparbase with other database synchronization and keep-alive tools. See how we stack up against alternatives.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/comparison',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function ComparisonPage() {
  return <ComparisonPageClient />;
}
