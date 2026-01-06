import type { Metadata } from 'next';
import TermsPageClient from './TermsPageClient';

export const metadata: Metadata = {
  title: 'Terms of Service | suparbase',
  description: 'Terms of Service for suparbase - Read our terms and conditions for using the database synchronization tool.',
  keywords: ['terms of service', 'terms and conditions', 'legal', 'supabase terms', 'database sync terms'],
  openGraph: {
    title: 'Terms of Service | suparbase',
    description: 'Terms of Service for suparbase - Read our terms and conditions for using the database synchronization tool.',
    url: 'https://suparbase.com/terms',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Terms of Service',
      },
    ],
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | suparbase',
    description: 'Terms of Service for suparbase - Read our terms and conditions for using the database synchronization tool.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/terms',
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

export default function TermsPage() {
  return <TermsPageClient />;
}

