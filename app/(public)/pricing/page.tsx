import type { Metadata } from 'next';
import PricingPageClient from './PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing | suparbase - Database Sync & Keep-Alive Tools',
  description: 'suparbase is currently in beta testing phase and free to use. Get started with database synchronization and keep-alive services at no cost.',
  keywords: ['suparbase pricing', 'free database sync', 'beta testing', 'supabase tools pricing', 'free tier'],
  openGraph: {
    title: 'Pricing | suparbase - Database Sync & Keep-Alive Tools',
    description: 'suparbase is currently in beta testing phase and free to use. Get started with database synchronization at no cost.',
    url: 'https://suparbase.com/pricing',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Pricing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | suparbase - Database Sync & Keep-Alive Tools',
    description: 'suparbase is currently in beta testing phase and free to use. Get started with database synchronization at no cost.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/pricing',
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

export default function PricingPage() {
  return <PricingPageClient />;
}




