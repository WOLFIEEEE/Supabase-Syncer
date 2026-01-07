import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact | suparbase - Database Sync & Keep-Alive Tools',
  description: 'Get in touch with the suparbase team. Have questions, feedback, or need support? We\'re here to help.',
  keywords: ['contact suparbase', 'supabase support', 'database sync support', 'help', 'feedback'],
  openGraph: {
    title: 'Contact | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Get in touch with the suparbase team. Have questions, feedback, or need support?',
    url: 'https://suparbase.com/contact',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Contact',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Get in touch with the suparbase team. Have questions, feedback, or need support?',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/contact',
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

export default function ContactPage() {
  return <ContactPageClient />;
}



