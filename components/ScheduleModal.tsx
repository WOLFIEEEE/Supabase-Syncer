'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Select,
  Switch,
  Text,
  Badge,
  Alert,
  AlertIcon,
  SimpleGrid,
  Box,
  Tooltip,
  Code,
} from '@chakra-ui/react';
import { 
  CRON_PRESETS, 
  validateCronExpression, 
  describeCron, 
  calculateNextRun 
} from '@/lib/services/scheduler';

// Icons
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: {
    name: string;
    cronExpression: string;
    timezone: string;
    enabled: boolean;
  }) => void;
  initialValues?: {
    name?: string;
    cronExpression?: string;
    timezone?: string;
    enabled?: boolean;
  };
  isEditing?: boolean;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  isEditing = false,
}: ScheduleModalProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [cronExpression, setCronExpression] = useState(
    initialValues?.cronExpression || CRON_PRESETS.daily
  );
  const [timezone, setTimezone] = useState(initialValues?.timezone || 'UTC');
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true);
  const [usePreset, setUsePreset] = useState(true);
  
  const validation = validateCronExpression(cronExpression);
  const description = validation.valid ? describeCron(cronExpression) : '';
  const nextRun = validation.valid ? calculateNextRun(cronExpression) : null;
  
  const handleSubmit = () => {
    if (!validation.valid || !name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      cronExpression,
      timezone,
      enabled,
    });
    
    onClose();
  };
  
  const presetOptions = [
    { value: CRON_PRESETS.every5Minutes, label: 'Every 5 minutes' },
    { value: CRON_PRESETS.every15Minutes, label: 'Every 15 minutes' },
    { value: CRON_PRESETS.every30Minutes, label: 'Every 30 minutes' },
    { value: CRON_PRESETS.everyHour, label: 'Every hour' },
    { value: CRON_PRESETS.every6Hours, label: 'Every 6 hours' },
    { value: CRON_PRESETS.every12Hours, label: 'Every 12 hours' },
    { value: CRON_PRESETS.daily, label: 'Daily at midnight' },
    { value: CRON_PRESETS.dailyAt9AM, label: 'Daily at 9 AM' },
    { value: CRON_PRESETS.weekly, label: 'Weekly (Sunday)' },
    { value: CRON_PRESETS.monthly, label: 'Monthly (1st day)' },
  ];
  
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
  ];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="surface.800" borderColor="surface.700">
        <ModalHeader color="white">
          <HStack spacing={2}>
            <CalendarIcon />
            <Text>{isEditing ? 'Edit Schedule' : 'Create Schedule'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="surface.400" />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Name */}
            <FormControl isRequired>
              <FormLabel color="surface.300">Schedule Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Production Sync"
                bg="surface.700"
                borderColor="surface.600"
                color="white"
              />
            </FormControl>
            
            {/* Schedule Type Toggle */}
            <HStack>
              <Button
                size="sm"
                variant={usePreset ? 'solid' : 'ghost'}
                colorScheme={usePreset ? 'teal' : 'gray'}
                onClick={() => setUsePreset(true)}
              >
                Preset
              </Button>
              <Button
                size="sm"
                variant={!usePreset ? 'solid' : 'ghost'}
                colorScheme={!usePreset ? 'teal' : 'gray'}
                onClick={() => setUsePreset(false)}
              >
                Custom Cron
              </Button>
            </HStack>
            
            {/* Schedule Selection */}
            {usePreset ? (
              <FormControl>
                <FormLabel color="surface.300">Frequency</FormLabel>
                <Select
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  bg="surface.700"
                  borderColor="surface.600"
                  color="white"
                >
                  {presetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <FormControl isInvalid={!validation.valid}>
                <FormLabel color="surface.300">Cron Expression</FormLabel>
                <Input
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="* * * * *"
                  fontFamily="mono"
                  bg="surface.700"
                  borderColor="surface.600"
                  color="white"
                />
                <FormHelperText color="surface.500">
                  Format: minute hour day month day-of-week
                </FormHelperText>
                {!validation.valid && (
                  <Text color="red.400" fontSize="sm" mt={1}>
                    {validation.error}
                  </Text>
                )}
              </FormControl>
            )}
            
            {/* Timezone */}
            <FormControl>
              <FormLabel color="surface.300">Timezone</FormLabel>
              <Select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                bg="surface.700"
                borderColor="surface.600"
                color="white"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            {/* Enabled Toggle */}
            <FormControl display="flex" alignItems="center">
              <FormLabel color="surface.300" mb={0}>
                Enable Schedule
              </FormLabel>
              <Switch
                isChecked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                colorScheme="teal"
              />
            </FormControl>
            
            {/* Schedule Preview */}
            {validation.valid && (
              <Box bg="surface.700" p={4} borderRadius="md">
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text color="surface.400" fontSize="sm">Description:</Text>
                    <Text color="white" fontSize="sm">{description}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="surface.400" fontSize="sm">Cron:</Text>
                    <Code bg="surface.600" color="teal.300" px={2}>
                      {cronExpression}
                    </Code>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack spacing={1}>
                      <ClockIcon />
                      <Text color="surface.400" fontSize="sm">Next Run:</Text>
                    </HStack>
                    {nextRun ? (
                      <Tooltip label={nextRun.toISOString()}>
                        <Badge colorScheme="teal">
                          {nextRun.toLocaleString()}
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Badge colorScheme="gray">Not scheduled</Badge>
                    )}
                  </HStack>
                </VStack>
              </Box>
            )}
            
            {/* Help */}
            <Alert status="info" bg="surface.700" borderRadius="md">
              <AlertIcon />
              <Box fontSize="sm">
                <Text color="white" fontWeight="bold">Cron Format</Text>
                <SimpleGrid columns={5} spacing={2} mt={2}>
                  <Text color="surface.400">minute</Text>
                  <Text color="surface.400">hour</Text>
                  <Text color="surface.400">day</Text>
                  <Text color="surface.400">month</Text>
                  <Text color="surface.400">weekday</Text>
                  <Text color="surface.300">0-59</Text>
                  <Text color="surface.300">0-23</Text>
                  <Text color="surface.300">1-31</Text>
                  <Text color="surface.300">1-12</Text>
                  <Text color="surface.300">0-6</Text>
                </SimpleGrid>
                <Text color="surface.400" mt={2}>
                  Use * for any, */n for every n, and 1-5 for ranges
                </Text>
              </Box>
            </Alert>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
            isDisabled={!validation.valid || !name.trim()}
          >
            {isEditing ? 'Save Changes' : 'Create Schedule'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ScheduleModal;


