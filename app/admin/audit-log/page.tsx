import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import AuditLogClient from './AuditLogClient';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const adminUser = await requireAdminAccess();
  return <AuditLogClient adminUser={adminUser} />;
}

