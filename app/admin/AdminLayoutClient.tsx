'use client';

import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  adminUser: { id: string; email: string };
}

export default function AdminLayoutClient({
  children,
  adminUser,
}: AdminLayoutClientProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      {/* Sidebar */}
      <AdminSidebar adminUser={adminUser} isOpen={isOpen} onClose={onClose} isMobile={true} />
      <AdminSidebar adminUser={adminUser} />

      {/* Main Content Area */}
      <Flex
        ml={{ base: 0, md: '280px' }}
        direction="column"
        minH="100vh"
      >
        {/* Header */}
        <AdminHeader onMenuClick={onOpen} adminUser={adminUser} />

        {/* Page Content */}
        <Box flex={1} p={{ base: 4, md: 6 }}>
          {children}
        </Box>
      </Flex>
    </Box>
  );
}

