import type { Metadata } from 'next';
import BlogPageClient from './BlogPageClient';

export const metadata: Metadata = {
  title: 'Blog | suparbase - Database Sync & Keep-Alive Tools',
  description: 'Learn about Supabase database synchronization, keep-alive strategies, schema management, and best practices. Tutorials, tips, and guides for developers.',
  keywords: [
    'supabase blog',
    'database sync tutorials',
    'supabase keep-alive',
    'postgres sync guides',
    'database migration tips',
    'supabase best practices',
    'database management articles',
  ],
  openGraph: {
    title: 'Blog | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Learn about Supabase database synchronization, keep-alive strategies, schema management, and best practices.',
    url: 'https://suparbase.com/blog',
    siteName: 'suparbase',
    images: [
      {
        url: 'https://suparbase.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'suparbase - Blog',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | suparbase - Database Sync & Keep-Alive Tools',
    description: 'Learn about Supabase database synchronization, keep-alive strategies, schema management, and best practices.',
    images: ['https://suparbase.com/logo.png'],
  },
  alternates: {
    canonical: 'https://suparbase.com/blog',
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

export default function BlogPage() {
  return <BlogPageClient />;
}
