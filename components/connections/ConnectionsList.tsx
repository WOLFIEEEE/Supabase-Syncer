'use client';

import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { Connection } from './types';
import { DatabaseIcon, EyeIcon, PlusIcon, TrashIcon, ZapIcon } from './icons';

const MotionCard = motion.create(Card);

interface ConnectionsListProps {
  connections: Connection[];
  testingConnectionId: string | null;
  onInspect: (connection: Connection) => void;
  onTest: (connection: Connection) => void;
  onDelete: (connectionId: string) => void;
  onAddConnection: () => void;
}

export default function ConnectionsList({
  connections,
  testingConnectionId,
  onInspect,
  onTest,
  onDelete,
  onAddConnection,
}: ConnectionsListProps) {
  if (connections.length === 0) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4} py={12}>
            <Box color="text.tertiary">
              <DatabaseIcon />
            </Box>
            <Text color="text.secondary">No connections configured</Text>
            <Button leftIcon={<PlusIcon />} onClick={onAddConnection}>
              Add your first connection
            </Button>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {connections.map((connection, index) => (
        <MotionCard
          key={connection.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.04 }}
          cursor="pointer"
          onClick={() => onInspect(connection)}
          _hover={{ borderColor: 'accent.primary', transform: 'translateY(-1px)' }}
          style={{ transition: 'all 0.2s' }}
        >
          <CardBody p={{ base: 3, md: 4 }}>
            <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={{ base: 3, sm: 0 }}>
              <HStack spacing={{ base: 3, md: 4 }} flex={1} minW={0}>
                <Box p={{ base: 2, md: 3 }} borderRadius="lg" bg={connection.environment === 'production' ? 'rgba(230, 51, 51, 0.2)' : 'rgba(23, 177, 110, 0.2)'} flexShrink={0}>
                  <DatabaseIcon />
                </Box>
                <VStack align="start" spacing={0} minW={0} flex={1}>
                  <Text color="text.primary" fontWeight="semibold" fontSize={{ base: 'md', md: 'lg' }} isTruncated maxW="100%">
                    {connection.name}
                  </Text>
                  <HStack spacing={2}>
                    <Text color="text.tertiary" fontSize={{ base: 'xs', md: 'sm' }}>
                      Created {new Date(connection.createdAt).toLocaleDateString()}
                    </Text>
                    <Text color="accent.primary" fontSize={{ base: 'xs', md: 'sm' }} display={{ base: 'none', md: 'block' }}>
                      • Click to inspect schema
                    </Text>
                  </HStack>
                </VStack>
              </HStack>
              <HStack spacing={2} w={{ base: '100%', sm: 'auto' }} justify={{ base: 'space-between', sm: 'flex-end' }}>
                <HStack spacing={2}>
                  <Badge colorScheme={connection.environment === 'production' ? 'red' : 'green'} fontSize={{ base: 'xs', md: 'sm' }} px={{ base: 2, md: 3 }} py={1}>
                    {connection.environment.toUpperCase()}
                  </Badge>
                  <Tooltip label="Test Connection" hasArrow>
                    <IconButton
                      aria-label="Test connection"
                      icon={testingConnectionId === connection.id ? <Spinner size="sm" /> : <ZapIcon />}
                      variant="ghost"
                      colorScheme="yellow"
                      size="sm"
                      isLoading={testingConnectionId === connection.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onTest(connection);
                      }}
                    />
                  </Tooltip>
                  <Tooltip label="Inspect Schema" hasArrow>
                    <IconButton
                      aria-label="Inspect schema"
                      icon={<EyeIcon />}
                      variant="ghost"
                      colorScheme="teal"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onInspect(connection);
                      }}
                    />
                  </Tooltip>
                </HStack>
                <IconButton
                  aria-label="Delete connection"
                  icon={<TrashIcon />}
                  variant="ghost"
                  colorScheme="red"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(connection.id);
                  }}
                />
              </HStack>
            </Flex>
          </CardBody>
        </MotionCard>
      ))}
    </VStack>
  );
}
