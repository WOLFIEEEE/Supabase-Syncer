'use client';

import { Box, Flex } from '@chakra-ui/react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex direction="column" minH="100vh" className="gradient-mesh">
      <PublicNavbar />
      <Box flex={1}>
        {children}
      </Box>
      <PublicFooter />
    </Flex>
  );
}

