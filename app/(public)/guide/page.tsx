import type { Metadata } from 'next';
import GuidePageClient from './GuidePageClient';

export const metadata: Metadata = {
  title: 'Getting Started Guide | suparbase',
  description: 'Complete guide to using suparbase for database synchronization and keep-alive. Step-by-step instructions, best practices, and troubleshooting.',
  keywords: ['supabase guide', 'database sync tutorial', 'supabase sync setup', 'database migration guide', 'supabase keep-alive'],
  openGraph: {
    title: 'Getting Started Guide | suparbase',
    description: 'Complete guide to using suparbase for database synchronization and keep-alive. Step-by-step instructions, best practices, and troubleshooting.',
    url: 'https://suparbase.com/guide',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Getting Started Guide',
      },
    ],
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Getting Started Guide | suparbase',
    description: 'Complete guide to using suparbase for database synchronization and keep-alive.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/guide',
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

export default function GuidePage() {
  return <GuidePageClient />;
}

