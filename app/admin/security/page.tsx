import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import SecurityMonitoringClient from './SecurityMonitoringClient';

export const dynamic = 'force-dynamic';

export default async function SecurityMonitoringPage() {
  const adminUser = await requireAdminAccess();
  return <SecurityMonitoringClient adminUser={adminUser} />;
}

