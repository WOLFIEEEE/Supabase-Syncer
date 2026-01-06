import type { Metadata } from 'next';
import BenefitsPageClient from './BenefitsPageClient';

export const metadata: Metadata = {
  title: 'Benefits - suparbase | Why Choose Suparbase',
  description: 'Discover the key benefits of using suparbase: time savings, risk reduction, cost efficiency, and improved developer experience.',
  keywords: ['supabase benefits', 'database sync advantages', 'why suparbase', 'database management benefits'],
  openGraph: {
    title: 'Benefits - suparbase',
    description: 'Why developers choose suparbase for database synchronization.',
    url: 'https://suparbase.com/benefits',
    type: 'website',
  },
};

export default function BenefitsPage() {
  return <BenefitsPageClient />;
}


