import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = {
  title: 'suparbase - Sync Supabase Databases | Keep Databases Alive',
  description: 'Open-source tool to sync Supabase databases between environments. Prevent free tier pausing with automated keep-alive. Schema validation, migration generation, and real-time sync.',
  keywords: ['supabase sync', 'database sync', 'supabase tools', 'postgres sync', 'database migration', 'supabase keep-alive', 'database synchronization'],
  openGraph: {
    title: 'suparbase - Sync Supabase Databases | Keep Databases Alive',
    description: 'Open-source tool to sync Supabase databases between environments. Prevent free tier pausing with automated keep-alive.',
    url: 'https://suparbase.com',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Supabase Database Sync Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'suparbase - Sync Supabase Databases | Keep Databases Alive',
    description: 'Open-source tool to sync Supabase databases between environments. Prevent free tier pausing with automated keep-alive.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com',
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

export default function LandingPage() {
  return <LandingPageClient />;
}

