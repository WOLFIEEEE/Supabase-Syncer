import type { Metadata } from 'next';
import ResourcesPageClient from './ResourcesPageClient';

export const metadata: Metadata = {
  title: 'Resources | suparbase - Tutorials, Templates & Guides',
  description: 'Access tutorials, templates, API documentation, and guides for Supabase database synchronization and management. Learn best practices and get started quickly.',
  keywords: [
    'supabase tutorials',
    'database sync templates',
    'supabase guides',
    'postgres resources',
    'database management tutorials',
    'supabase API docs',
    'database sync examples',
  ],
  openGraph: {
    title: 'Resources | suparbase - Tutorials, Templates & Guides',
    description: 'Access tutorials, templates, API documentation, and guides for Supabase database synchronization and management.',
    url: 'https://suparbase.com/resources',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Resources',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resources | suparbase - Tutorials, Templates & Guides',
    description: 'Access tutorials, templates, API documentation, and guides for Supabase database synchronization and management.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/resources',
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

export default function ResourcesPage() {
  return <ResourcesPageClient />;
}
