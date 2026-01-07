import type { Metadata } from 'next';
import PrivacyPageClient from './PrivacyPageClient';

export const metadata: Metadata = {
  title: 'Privacy Policy | suparbase',
  description: 'Privacy Policy for suparbase - Learn how we protect your data, handle database connections, and ensure security. Open-source database synchronization tool.',
  keywords: ['privacy policy', 'data protection', 'GDPR', 'security', 'supabase privacy', 'database security'],
  openGraph: {
    title: 'Privacy Policy | suparbase',
    description: 'Privacy Policy for suparbase - Learn how we protect your data and ensure security.',
    url: 'https://suparbase.com/privacy',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Privacy Policy',
      },
    ],
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | suparbase',
    description: 'Privacy Policy for suparbase - Learn how we protect your data and ensure security.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/privacy',
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

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}



