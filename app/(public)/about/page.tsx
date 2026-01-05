import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About | suparbase - Database Sync & Keep-Alive Tools',
  description: 'Learn about suparbase - an open-source tool for syncing Supabase databases, preventing free tier pausing, and managing database migrations.',
  keywords: ['about suparbase', 'supabase tools', 'database sync', 'open source', 'supabase community'],
  openGraph: {
    title: 'About | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Learn about suparbase - an open-source tool for syncing Supabase databases and managing database migrations.',
    url: 'https://suparbase.com/about',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - About',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Learn about suparbase - an open-source tool for syncing Supabase databases and managing database migrations.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/about',
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

export default function AboutPage() {
  return <AboutPageClient />;
}

