'use client';

import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Badge,
  Divider,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';

// Icons
const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const DangerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="9 12 12 15 16 10"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

interface ValidationIssue {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  message: string;
  tableName: string;
  details?: string;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  loadingStatus?: string;
  
  // Confirmation type
  type: 'production' | 'high_risk' | 'standard';
  
  // Target info
  targetName: string;
  targetEnvironment: 'production' | 'development';
  
  // Validation issues to display
  issues?: ValidationIssue[];
  
  // Summary stats
  summary?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  
  // Sync stats
  syncStats?: {
    tables: number;
    inserts: number;
    updates: number;
  };
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  loadingStatus = 'Starting...',
  type,
  targetName,
  targetEnvironment,
  issues = [],
  summary,
  syncStats,
}: ConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  
  const isProduction = targetEnvironment === 'production';
  const requiresTextConfirmation = type === 'production' || type === 'high_risk';
  const confirmationPhrase = isProduction ? targetName : 'CONFIRM';
  const canConfirm = !requiresTextConfirmation || confirmText === confirmationPhrase;
  
  const handleClose = () => {
    setConfirmText('');
    onClose();
  };
  
  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      setConfirmText('');
    }
  };
  
  // Filter issues by severity for display
  const criticalIssues = issues.filter((i) => i.severity === 'CRITICAL');
  const highIssues = issues.filter((i) => i.severity === 'HIGH');
  const otherIssues = issues.filter((i) => !['CRITICAL', 'HIGH'].includes(i.severity));
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <ModalHeader>
          <HStack spacing={3}>
            <Box color={isProduction ? 'red.400' : 'orange.400'}>
              {isProduction ? <DangerIcon /> : <WarningIcon />}
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="white">
                {isProduction ? '⚠️ Production Sync Confirmation' : 'Confirm Sync Operation'}
              </Text>
              <Text fontSize="sm" color="surface.400" fontWeight="normal">
                Review carefully before proceeding
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Target Info */}
            <Alert 
              status={isProduction ? 'error' : 'warning'} 
              borderRadius="md"
              bg={isProduction ? 'red.900' : 'orange.900'}
            >
              <AlertIcon />
              <Box>
                <AlertTitle>
                  Target: {targetName}
                </AlertTitle>
                <AlertDescription>
                  <HStack>
                    <Badge colorScheme={isProduction ? 'red' : 'green'}>
                      {targetEnvironment.toUpperCase()}
                    </Badge>
                    {isProduction && (
                      <Text fontSize="sm">
                        This will modify production data!
                      </Text>
                    )}
                  </HStack>
                </AlertDescription>
              </Box>
            </Alert>
            
            {/* Sync Stats */}
            {syncStats && (
              <Box bg="surface.900" p={4} borderRadius="md">
                <Text color="surface.300" fontSize="sm" mb={2}>Sync Summary</Text>
                <HStack spacing={6}>
                  <VStack spacing={0}>
                    <Text color="white" fontWeight="bold">{syncStats.tables}</Text>
                    <Text color="surface.400" fontSize="xs">Tables</Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text color="green.400" fontWeight="bold">{syncStats.inserts.toLocaleString()}</Text>
                    <Text color="surface.400" fontSize="xs">Inserts</Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text color="blue.400" fontWeight="bold">{syncStats.updates.toLocaleString()}</Text>
                    <Text color="surface.400" fontSize="xs">Updates</Text>
                  </VStack>
                </HStack>
              </Box>
            )}
            
            {/* Validation Summary */}
            {summary && (summary.critical > 0 || summary.high > 0) && (
              <>
                <Divider borderColor="surface.700" />
                <Box>
                  <Text color="surface.300" fontSize="sm" mb={2}>Validation Issues</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {summary.critical > 0 && (
                      <Badge colorScheme="red" variant="solid">
                        {summary.critical} Critical
                      </Badge>
                    )}
                    {summary.high > 0 && (
                      <Badge colorScheme="orange" variant="solid">
                        {summary.high} High Risk
                      </Badge>
                    )}
                    {summary.medium > 0 && (
                      <Badge colorScheme="yellow" variant="outline">
                        {summary.medium} Medium
                      </Badge>
                    )}
                    {summary.low > 0 && (
                      <Badge colorScheme="blue" variant="outline">
                        {summary.low} Low
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </>
            )}
            
            {/* Critical Issues */}
            {criticalIssues.length > 0 && (
              <Box bg="red.900" p={3} borderRadius="md">
                <Text color="red.200" fontWeight="bold" fontSize="sm" mb={2}>
                  Critical Issues (Must Fix)
                </Text>
                <List spacing={1}>
                  {criticalIssues.slice(0, 3).map((issue) => (
                    <ListItem key={issue.id} fontSize="sm" color="red.100">
                      <ListIcon as={() => <AlertCircleIcon />} color="red.300" />
                      <Text as="span" fontFamily="mono" color="red.300">{issue.tableName}</Text>
                      : {issue.message}
                    </ListItem>
                  ))}
                  {criticalIssues.length > 3 && (
                    <Text fontSize="xs" color="red.300" mt={1}>
                      +{criticalIssues.length - 3} more critical issues
                    </Text>
                  )}
                </List>
              </Box>
            )}
            
            {/* High Risk Issues */}
            {highIssues.length > 0 && (
              <Box bg="orange.900" p={3} borderRadius="md">
                <Text color="orange.200" fontWeight="bold" fontSize="sm" mb={2}>
                  High Risk Issues
                </Text>
                <List spacing={1}>
                  {highIssues.slice(0, 3).map((issue) => (
                    <ListItem key={issue.id} fontSize="sm" color="orange.100">
                      <ListIcon as={() => <AlertCircleIcon />} color="orange.300" />
                      <Text as="span" fontFamily="mono" color="orange.300">{issue.tableName}</Text>
                      : {issue.message}
                    </ListItem>
                  ))}
                  {highIssues.length > 3 && (
                    <Text fontSize="xs" color="orange.300" mt={1}>
                      +{highIssues.length - 3} more high risk issues
                    </Text>
                  )}
                </List>
              </Box>
            )}
            
            {/* Confirmation Input */}
            {requiresTextConfirmation && (
              <>
                <Divider borderColor="surface.700" />
                <Box>
                  <Text color="surface.300" fontSize="sm" mb={2}>
                    To confirm, type <Text as="span" color="red.400" fontWeight="bold" fontFamily="mono">{confirmationPhrase}</Text>
                  </Text>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={confirmationPhrase}
                    bg="surface.900"
                    borderColor={confirmText === confirmationPhrase ? 'green.500' : 'surface.600'}
                    _focus={{
                      borderColor: confirmText === confirmationPhrase ? 'green.500' : 'red.500',
                    }}
                    fontFamily="mono"
                  />
                  {confirmText && confirmText !== confirmationPhrase && (
                    <Text color="red.400" fontSize="xs" mt={1}>
                      Text does not match
                    </Text>
                  )}
                  {confirmText === confirmationPhrase && (
                    <HStack color="green.400" fontSize="xs" mt={1}>
                      <CheckCircleIcon />
                      <Text>Confirmed</Text>
                    </HStack>
                  )}
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme={isProduction ? 'red' : 'orange'}
              onClick={handleConfirm}
              isDisabled={!canConfirm || criticalIssues.length > 0 || isLoading}
              isLoading={isLoading}
              loadingText={loadingStatus}
            >
              {criticalIssues.length > 0 
                ? 'Cannot Proceed (Fix Critical Issues)'
                : isProduction 
                  ? 'Sync to Production' 
                  : 'Confirm & Start Sync'
              }
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

