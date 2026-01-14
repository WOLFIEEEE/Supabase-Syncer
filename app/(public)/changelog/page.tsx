import type { Metadata } from 'next';
import ChangelogPageClient from './ChangelogPageClient';

export const metadata: Metadata = {
  title: 'Changelog | suparbase - Product Updates & Release Notes',
  description: 'Stay updated with the latest suparbase features, improvements, and fixes. View our product changelog and release history.',
  keywords: [
    'supabase changelog',
    'product updates',
    'release notes',
    'supabase features',
    'database sync updates',
    'product roadmap',
    'version history',
  ],
  openGraph: {
    title: 'Changelog | suparbase - Product Updates & Release Notes',
    description: 'Stay updated with the latest suparbase features, improvements, and fixes. View our product changelog and release history.',
    url: 'https://suparbase.com/changelog',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Changelog',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog | suparbase - Product Updates & Release Notes',
    description: 'Stay updated with the latest suparbase features, improvements, and fixes. View our product changelog and release history.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/changelog',
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

export default function ChangelogPage() {
  return <ChangelogPageClient />;
}
