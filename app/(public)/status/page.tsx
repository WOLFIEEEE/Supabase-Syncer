import type { Metadata } from 'next';
import StatusPageClient from './StatusPageClient';

export const metadata: Metadata = {
  title: 'System Status | suparbase',
  description: 'Real-time system status, uptime, and service health for suparbase platform. Monitor database connections, keep-alive services, and component status.',
  keywords: ['suparbase status', 'system status', 'uptime monitoring', 'service health', 'database status'],
  openGraph: {
    title: 'System Status | suparbase',
    description: 'Real-time system status, uptime, and service health for suparbase platform.',
    url: 'https://suparbase.com/status',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - System Status',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'System Status | suparbase',
    description: 'Real-time system status, uptime, and service health for suparbase platform.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/status',
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

export default function StatusPage() {
  return <StatusPageClient />;
}

