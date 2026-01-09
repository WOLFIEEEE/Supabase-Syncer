/**
 * Admin User Management Page
 */

import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import UserManagementClient from './UserManagementClient';

export const dynamic = 'force-dynamic';

export default async function UserManagementPage() {
  const adminUser = await requireAdminAccess();
  
  return <UserManagementClient adminUser={adminUser} />;
}

