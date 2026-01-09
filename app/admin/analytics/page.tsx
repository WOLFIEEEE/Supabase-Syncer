import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsDashboardPage() {
  const adminUser = await requireAdminAccess();
  return <AnalyticsDashboardClient adminUser={adminUser} />;
}

