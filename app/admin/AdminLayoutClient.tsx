'use client';

import { Box } from '@chakra-ui/react';

export default function AdminLayoutClient({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      {children}
    </Box>
  );
}

