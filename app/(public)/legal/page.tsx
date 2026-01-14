import type { Metadata } from 'next';
import LegalPageClient from './LegalPageClient';

export const metadata: Metadata = {
    title: 'Legal Notice & Disclaimers | suparbase',
    description: 'Legal information, disclaimers, and terms of use for suparbase. Independent tool not affiliated with Supabase Inc.',
    robots: {
        index: false, // Usually legal pages like this for small tools don't strictly need to be indexed, but 'true' is fine too. Let's stick to true or follow suit. 
        // Actually user said "make sure we in any way not related", so index: true is better so people find this page if they search "suparbase supabase affiliation"
        follow: true,
    },
};

export default function LegalPage() {
    return <LegalPageClient />;
}
