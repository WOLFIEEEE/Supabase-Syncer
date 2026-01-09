import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import { getSystemStatus } from '@/lib/services/real-time-monitor';
import SystemHealthClient from './SystemHealthClient';

export const dynamic = 'force-dynamic';

export default async function SystemHealthPage() {
  const adminUser = await requireAdminAccess();
  const systemStatus = await getSystemStatus();
  return <SystemHealthClient adminUser={adminUser} systemStatus={systemStatus} />;
}

