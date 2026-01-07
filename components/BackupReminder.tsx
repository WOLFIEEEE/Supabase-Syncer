'use client';

import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  Checkbox,
  HStack,
  VStack,
  Text,
  Code,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { useState } from 'react';

interface BackupReminderProps {
  targetName: string;
  targetEnvironment: 'production' | 'development';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  actionLabel?: string;
}

export default function BackupReminder({
  targetName,
  targetEnvironment,
  onConfirm,
  onCancel,
  isLoading = false,
  actionLabel = 'Proceed',
}: BackupReminderProps) {
  const [hasBackup, setHasBackup] = useState(false);
  const [understandsRisks, setUnderstandsRisks] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  const isProduction = targetEnvironment === 'production';
  const canProceed = isProduction ? (hasBackup && understandsRisks) : true;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleCancel} 
      size="lg" 
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
      <ModalContent bg="surface.800" borderColor="surface.700">
        <ModalHeader color="white">
          {isProduction ? '⚠️ Production Database Warning' : '📋 Before You Proceed'}
        </ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {isProduction ? (
              <Alert status="error" borderRadius="md" bg="red.900">
                <AlertIcon />
                <Box>
                  <AlertTitle>Production Database!</AlertTitle>
                  <AlertDescription>
                    You are about to modify <Code bg="red.800">{targetName}</Code>. 
                    This action may affect live data.
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <Alert status="info" borderRadius="md" bg="blue.900">
                <AlertIcon />
                <Box>
                  <AlertTitle>Development Database</AlertTitle>
                  <AlertDescription>
                    You are modifying <Code bg="blue.800">{targetName}</Code>.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <Accordion allowToggle>
              <AccordionItem bg="surface.900" border="none" borderRadius="md">
                <AccordionButton>
                  <Box flex="1" textAlign="left" color="white" fontWeight="medium">
                    📦 Backup Instructions
                  </Box>
                  <AccordionIcon color="surface.400" />
                </AccordionButton>
                <AccordionPanel>
                  <VStack align="start" spacing={3} color="surface.300" fontSize="sm">
                    <Text fontWeight="medium">Supabase Dashboard:</Text>
                    <Text>1. Go to Settings → Database</Text>
                    <Text>2. Click "Create a backup" or enable PITR</Text>
                    
                    <Text fontWeight="medium" mt={2}>Using pg_dump:</Text>
                    <Code 
                      display="block" 
                      p={3} 
                      bg="gray.900" 
                      borderRadius="md" 
                      whiteSpace="pre-wrap"
                      fontSize="xs"
                    >
{`pg_dump -h [HOST] -U postgres -d [DATABASE] \\
  --format=custom --file=backup_$(date +%Y%m%d_%H%M%S).dump`}
                    </Code>

                    <Text fontWeight="medium" mt={2}>Quick Restore:</Text>
                    <Code 
                      display="block" 
                      p={3} 
                      bg="gray.900" 
                      borderRadius="md" 
                      whiteSpace="pre-wrap"
                      fontSize="xs"
                    >
{`pg_restore -h [HOST] -U postgres -d [DATABASE] backup.dump`}
                    </Code>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            {isProduction && (
              <VStack align="start" spacing={3} pt={2}>
                <Checkbox
                  colorScheme="teal"
                  isChecked={hasBackup}
                  onChange={(e) => setHasBackup(e.target.checked)}
                >
                  <Text color="white" fontSize="sm">
                    I have created a backup of the production database
                  </Text>
                </Checkbox>
                <Checkbox
                  colorScheme="teal"
                  isChecked={understandsRisks}
                  onChange={(e) => setUnderstandsRisks(e.target.checked)}
                >
                  <Text color="white" fontSize="sm">
                    I understand this action may affect live data and users
                  </Text>
                </Checkbox>
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleCancel} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              colorScheme={isProduction ? 'red' : 'teal'}
              onClick={handleConfirm}
              isDisabled={!canProceed}
              isLoading={isLoading}
            >
              {actionLabel}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Simple inline version for embedding in forms
export function BackupReminderInline({
  targetEnvironment,
  hasBackup,
  setHasBackup,
  understandsRisks,
  setUnderstandsRisks,
}: {
  targetEnvironment: 'production' | 'development';
  hasBackup: boolean;
  setHasBackup: (value: boolean) => void;
  understandsRisks: boolean;
  setUnderstandsRisks: (value: boolean) => void;
}) {
  if (targetEnvironment !== 'production') return null;

  return (
    <Alert status="warning" borderRadius="md" bg="orange.900" flexDirection="column" alignItems="start">
      <HStack mb={3}>
        <AlertIcon />
        <AlertTitle>Production Safety Checks</AlertTitle>
      </HStack>
      <VStack align="start" spacing={2} w="100%">
        <Checkbox
          colorScheme="orange"
          isChecked={hasBackup}
          onChange={(e) => setHasBackup(e.target.checked)}
        >
          <Text color="white" fontSize="sm">
            I have created a backup of the production database
          </Text>
        </Checkbox>
        <Checkbox
          colorScheme="orange"
          isChecked={understandsRisks}
          onChange={(e) => setUnderstandsRisks(e.target.checked)}
        >
          <Text color="white" fontSize="sm">
            I understand this action may affect live users
          </Text>
        </Checkbox>
      </VStack>
    </Alert>
  );
}



