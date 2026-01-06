import type { Metadata } from 'next';
import FeaturesPageClient from './FeaturesPageClient';

export const metadata: Metadata = {
  title: 'Features | suparbase - Database Sync & Keep-Alive Tools',
  description: 'Discover all features of suparbase: database synchronization, schema validation, migration generation, keep-alive service, encrypted storage, and more. Open-source Supabase tools.',
  keywords: ['supabase features', 'database sync features', 'schema validation', 'migration generator', 'keep-alive', 'database tools', 'supabase sync features'],
  openGraph: {
    title: 'Features | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Discover all features of suparbase: database synchronization, schema validation, migration generation, and more.',
    url: 'https://suparbase.com/features',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Features',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Discover all features of suparbase: database synchronization, schema validation, migration generation, and more.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/features',
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

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}


