'use client';

import { Box, Button, Container, Flex, Heading, HStack, IconButton, Text } from '@chakra-ui/react';
import { ArrowLeftIcon, PlusIcon } from './icons';

interface ConnectionsHeaderProps {
  onBack: () => void;
  onAddConnection: () => void;
}

export default function ConnectionsHeader({ onBack, onAddConnection }: ConnectionsHeaderProps) {
  return (
    <Box
      as="header"
      bg="bg.surface"
      borderBottomWidth="1px"
      borderColor="border.default"
      position="sticky"
      top={0}
      zIndex={10}
      backdropFilter="blur(10px)"
    >
      <Container maxW="7xl" py={{ base: 3, md: 4 }} px={{ base: 4, md: 6 }}>
        <Flex justify="space-between" align="center" gap={2}>
          <HStack spacing={{ base: 2, md: 4 }} flex={1} minW={0}>
            <IconButton
              aria-label="Back"
              icon={<ArrowLeftIcon />}
              variant="ghost"
              size={{ base: 'sm', md: 'md' }}
              onClick={onBack}
            />
            <Heading size={{ base: 'sm', md: 'md' }} color="text.primary" isTruncated>
              Connections
            </Heading>
          </HStack>
          <Button leftIcon={<PlusIcon />} onClick={onAddConnection} size={{ base: 'sm', md: 'md' }}>
            <Text display={{ base: 'none', sm: 'inline' }}>Add Connection</Text>
            <Text display={{ base: 'inline', sm: 'none' }}>Add</Text>
          </Button>
        </Flex>
      </Container>
    </Box>
  );
}
