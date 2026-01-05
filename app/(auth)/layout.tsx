'use client';

import { Box } from '@chakra-ui/react';
import AuthHeader from '@/components/AuthHeader';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box minH="100vh" className="gradient-mesh">
      <AuthHeader />
      {children}
    </Box>
  );
}

