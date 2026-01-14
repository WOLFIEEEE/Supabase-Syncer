import type { Metadata } from 'next';
import IntegrationsPageClient from './IntegrationsPageClient';

export const metadata: Metadata = {
  title: 'Integrations | suparbase - Tool Integrations & Ecosystem',
  description: 'Discover integrations with GitHub, Vercel, Docker, and other tools. Connect suparbase with your favorite development tools and workflows.',
  keywords: [
    'supabase integrations',
    'github integration',
    'vercel integration',
    'docker integration',
    'database tools',
    'supabase ecosystem',
    'development tools',
  ],
  openGraph: {
    title: 'Integrations | suparbase - Tool Integrations & Ecosystem',
    description: 'Discover integrations with GitHub, Vercel, Docker, and other tools. Connect suparbase with your favorite development tools.',
    url: 'https://suparbase.com/integrations',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Integrations',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Integrations | suparbase - Tool Integrations & Ecosystem',
    description: 'Discover integrations with GitHub, Vercel, Docker, and other tools. Connect suparbase with your favorite development tools.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/integrations',
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

export default function IntegrationsPage() {
  return <IntegrationsPageClient />;
}
