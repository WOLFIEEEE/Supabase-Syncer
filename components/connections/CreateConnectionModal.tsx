'use client';

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import type { NewConnectionForm } from './types';

interface CreateConnectionModalProps {
  isOpen: boolean;
  isCreating: boolean;
  form: NewConnectionForm;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (value: NewConnectionForm) => void;
}

export default function CreateConnectionModal({ isOpen, isCreating, form, onClose, onSubmit, onChange }: CreateConnectionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent bg="bg.elevated" borderColor="border.default" mx={{ base: 0, md: 4 }} my={{ base: 0, md: 'auto' }}>
        <ModalHeader color="text.primary" fontSize={{ base: 'md', md: 'lg' }}>
          Add Database Connection
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel color="text.secondary">Connection Name</FormLabel>
              <Input
                placeholder="e.g., Production DB, Staging DB"
                value={form.name}
                onChange={(event) => onChange({ ...form, name: event.target.value })}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="text.secondary">Environment</FormLabel>
              <Select
                value={form.environment}
                onChange={(event) =>
                  onChange({
                    ...form,
                    environment: event.target.value as 'production' | 'development',
                  })
                }
              >
                <option value="development">Development</option>
                <option value="production">Production</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color="text.secondary">PostgreSQL Connection URL</FormLabel>
              <Textarea
                placeholder="postgresql://user:password@host:5432/database"
                value={form.databaseUrl}
                onChange={(event) => onChange({ ...form, databaseUrl: event.target.value })}
                rows={3}
                fontFamily="mono"
                fontSize="sm"
              />
              <Text color="text.tertiary" fontSize="xs" mt={2}>
                Your connection URL will be encrypted before storage
              </Text>
            </FormControl>

            {form.environment === 'production' && (
              <Box w="full" p={4} bg="rgba(230, 51, 51, 0.18)" borderRadius="md" borderWidth="1px" borderColor="rgba(255, 161, 161, 0.4)">
                <Text color="red.100" fontSize="sm">
                  <strong>Warning:</strong> You are adding a production database. Be careful when syncing data to this connection.
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isCreating}>
            Add Connection
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
