'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  Badge,
  Progress,
  Radio,
  RadioGroup,
  Stack,
  List,
  ListItem,
  ListIcon,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

interface WizardStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

interface QuickStartWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickStartWizard({ isOpen, onClose }: QuickStartWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('');

  const steps: WizardStep[] = [
    {
      id: 'goal',
      title: 'What do you want to do?',
      description: 'Choose your primary use case',
      content: (
        <RadioGroup value={selectedGoal} onChange={setSelectedGoal}>
          <Stack spacing={4}>
            <Radio value="schema-sync" size="lg">
              <VStack align="start" spacing={1} ml={2}>
                <Text fontWeight="bold" color="white">Schema Synchronization</Text>
                <Text fontSize="sm" color="surface.400">
                  Compare and sync database schemas between environments
                </Text>
              </VStack>
            </Radio>
            <Radio value="data-sync" size="lg">
              <VStack align="start" spacing={1} ml={2}>
                <Text fontWeight="bold" color="white">Data Synchronization</Text>
                <Text fontSize="sm" color="surface.400">
                  Copy data between databases with automatic rollback protection
                </Text>
              </VStack>
            </Radio>
            <Radio value="keep-alive" size="lg">
              <VStack align="start" spacing={1} ml={2}>
                <Text fontWeight="bold" color="white">Keep-Alive Service</Text>
                <Text fontSize="sm" color="surface.400">
                  Keep your database connections active to prevent timeouts
                </Text>
              </VStack>
            </Radio>
          </Stack>
        </RadioGroup>
      ),
    },
    {
      id: 'environment',
      title: 'Select your environment',
      description: 'Which environment are you working with?',
      content: (
        <RadioGroup value={selectedEnv} onChange={setSelectedEnv}>
          <Stack spacing={4}>
            <Radio value="development" size="lg">
              <VStack align="start" spacing={1} ml={2}>
                <Text fontWeight="bold" color="white">Development</Text>
                <Text fontSize="sm" color="surface.400">
                  Local or development database
                </Text>
              </VStack>
            </Radio>
            <Radio value="staging" size="lg">
              <VStack align="start" spacing={1} ml={2}>
                <Text fontWeight="bold" color="white">Staging</Text>
                <Text fontSize="sm" color="surface.400">
                  Staging or testing environment
                </Text>
              </VStack>
            </Radio>
            <Radio value="production" size="lg">
              <VStack align="start" spacing={1} ml={2}>
                <Text fontWeight="bold" color="white">Production</Text>
                <Text fontSize="sm" color="surface.400">
                  Live production database (extra safety checks enabled)
                </Text>
              </VStack>
            </Radio>
          </Stack>
        </RadioGroup>
      ),
    },
    {
      id: 'instructions',
      title: 'Next Steps',
      description: 'Follow these steps to get started',
      content: (
        <VStack align="stretch" spacing={4}>
          {selectedGoal === 'schema-sync' && (
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Heading size="sm" color="white">Schema Sync Steps:</Heading>
                  <List spacing={2}>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">1. Add your source and target database connections</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">2. Go to Schema Sync page</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">3. Select source and target databases</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">4. Review differences and generate migration script</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">5. Execute migration (with confirmation for production)</Text>
                      </HStack>
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>
          )}
          {selectedGoal === 'data-sync' && (
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Heading size="sm" color="white">Data Sync Steps:</Heading>
                  <List spacing={2}>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">1. Add your source and target database connections</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">2. Go to Sync page and create a new sync job</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">3. Select tables to sync and configure options</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">4. Run a dry-run first to preview changes</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">5. Start the sync and monitor progress in real-time</Text>
                      </HStack>
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>
          )}
          {selectedGoal === 'keep-alive' && (
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Heading size="sm" color="white">Keep-Alive Steps:</Heading>
                  <List spacing={2}>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">1. Add your database connection</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">2. Enable keep-alive from connection settings</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">3. Configure keep-alive interval (default: 5 minutes)</Text>
                      </HStack>
                    </ListItem>
                    <ListItem color="surface.300">
                      <HStack align="start" spacing={2}>
                        <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                        <Text fontSize="sm">4. Monitor connection status in dashboard</Text>
                      </HStack>
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>
          )}
          <Box bg="brand.500/10" p={4} borderRadius="md" borderWidth="1px" borderColor="brand.500/30">
            <Text color="brand.300" fontSize="sm" fontWeight="medium">
              💡 Tip: All operations include automatic rollback protection and real-time monitoring
            </Text>
          </Box>
        </VStack>
      ),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const canProceed = (currentStep === 0 && selectedGoal) || (currentStep === 1 && selectedEnv) || currentStep === 2;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (selectedGoal === 'schema-sync') {
      router.push('/schema-sync');
    } else if (selectedGoal === 'data-sync') {
      router.push('/sync/create');
    } else {
      router.push('/connections');
    }
    onClose();
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedGoal('');
    setSelectedEnv('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <ModalHeader>
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Heading size="md" color="white">
                Quick Start Guide
              </Heading>
              <IconButton
                aria-label="Close"
                icon={<CloseIcon />}
                variant="ghost"
                size="sm"
                onClick={onClose}
              />
            </HStack>
            <Progress value={progress} colorScheme="brand" size="sm" borderRadius="full" />
            <Text color="surface.400" fontSize="sm">
              Step {currentStep + 1} of {steps.length}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={6}>
            <VStack align="stretch" spacing={2}>
              <Heading size="sm" color="white">
                {steps[currentStep].title}
              </Heading>
              <Text color="surface.400" fontSize="sm">
                {steps[currentStep].description}
              </Text>
            </VStack>

            <Box minH="200px">
              {steps[currentStep].content}
            </Box>

            <HStack justify="space-between" pt={4}>
              <Button
                variant="ghost"
                onClick={currentStep === 0 ? onClose : handleBack}
                isDisabled={currentStep === 0}
              >
                {currentStep === 0 ? 'Cancel' : 'Back'}
              </Button>
              <HStack spacing={2}>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handleReset} size="sm">
                    Reset
                  </Button>
                )}
                <Button
                  colorScheme="brand"
                  onClick={handleNext}
                  isDisabled={!canProceed}
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

