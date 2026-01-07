import type { Metadata } from 'next';
import FAQPageClient from './FAQPageClient';

export const metadata: Metadata = {
  title: 'FAQ | suparbase - Database Sync & Keep-Alive Tools',
  description: 'Frequently asked questions about suparbase - database synchronization, keep-alive service, schema management, and more.',
  keywords: ['suparbase FAQ', 'database sync questions', 'supabase help', 'frequently asked questions', 'support'],
  openGraph: {
    title: 'FAQ | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Frequently asked questions about suparbase - database synchronization, keep-alive service, and schema management.',
    url: 'https://suparbase.com/faq',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - FAQ',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Frequently asked questions about suparbase - database synchronization, keep-alive service, and schema management.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/faq',
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

export default function FAQPage() {
  return <FAQPageClient />;
}



