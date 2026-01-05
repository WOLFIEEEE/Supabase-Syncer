'use client';

import { useRouter } from 'next/navigation';
import { Box, Container, Flex } from '@chakra-ui/react';
import { SuparbaseLogo } from '@/components/Logo';

export default function AuthHeader() {
  const router = useRouter();

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      bg="surface.900"
      borderBottomWidth="1px"
      borderColor="surface.700"
      zIndex={100}
      backdropFilter="blur(10px)"
      bgColor="rgba(9, 9, 11, 0.9)"
    >
      <Container maxW="6xl" py={3}>
        <Flex justify="flex-start" align="center">
          <Box
            cursor="pointer"
            onClick={() => router.push('/landing')}
            _hover={{ opacity: 0.8 }}
            transition="opacity 0.2s"
          >
            <SuparbaseLogo size="2xl" showText={true} variant="full" />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

