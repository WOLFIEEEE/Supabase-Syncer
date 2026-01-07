import type { Metadata } from 'next';
import TroubleshootingPageClient from './TroubleshootingPageClient';

export const metadata: Metadata = {
  title: 'Troubleshooting - suparbase | Common Issues & Solutions',
  description: 'Troubleshoot common issues with suparbase: connection problems, sync failures, schema conflicts, and performance issues.',
  keywords: ['supabase troubleshooting', 'database sync issues', 'connection problems', 'sync errors', 'troubleshooting guide'],
  openGraph: {
    title: 'Troubleshooting - suparbase',
    description: 'Common issues and solutions for suparbase database synchronization.',
    url: 'https://suparbase.com/troubleshooting',
    type: 'website',
  },
};

export default function TroubleshootingPage() {
  return <TroubleshootingPageClient />;
}



