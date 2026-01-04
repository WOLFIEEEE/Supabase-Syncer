'use client';

import { Box } from '@chakra-ui/react';
import PublicNavbar from '@/components/PublicNavbar';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box minH="100vh" className="gradient-mesh">
      <PublicNavbar />
      {children}
    </Box>
  );
}

