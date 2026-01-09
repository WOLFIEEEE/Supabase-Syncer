/**
 * Admin Sync Jobs Management Page
 */

import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import SyncJobsManagementClient from './SyncJobsManagementClient';

export const dynamic = 'force-dynamic';

export default async function SyncJobsManagementPage() {
  const adminUser = await requireAdminAccess();
  
  return <SyncJobsManagementClient adminUser={adminUser} />;
}

