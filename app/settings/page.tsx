'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Switch,
  Select,
  Input,
  Divider,
  Badge,
  useToast,
  IconButton,
  Flex,
  Code,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';

// Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

interface Settings {
  confirmProductionActions: boolean;
  showRowCounts: boolean;
  defaultSyncMode: 'one_way' | 'two_way';
  defaultConflictStrategy: string;
  autoValidateSchema: boolean;
  darkMode: boolean;
  compactView: boolean;
}

const defaultSettings: Settings = {
  confirmProductionActions: true,
  showRowCounts: true,
  defaultSyncMode: 'one_way',
  defaultConflictStrategy: 'last_write_wins',
  autoValidateSchema: true,
  darkMode: true,
  compactView: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('supabase-syncer-settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('supabase-syncer-settings', JSON.stringify(settings));
    setHasChanges(false);
    toast({
      title: 'Settings saved',
      status: 'success',
      duration: 2000,
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('supabase-syncer-settings');
    setHasChanges(false);
    toast({
      title: 'Settings reset to defaults',
      status: 'info',
      duration: 2000,
    });
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // In a real app, this would call an API to update the password
    toast({
      title: 'Password change not implemented',
      description: 'Update ADMIN_PASSWORD_HASH in .env.local manually',
      status: 'warning',
      duration: 5000,
    });
  };

  return (
    <Box minH="100vh" className="gradient-mesh">
      {/* Header */}
      <Box as="header" bg="surface.800" borderBottomWidth="1px" borderColor="surface.700">
        <Container maxW="4xl" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <IconButton
                aria-label="Back"
                icon={<ArrowLeftIcon />}
                variant="ghost"
                onClick={() => router.push('/')}
              />
              <Heading size="md" color="white">Settings</Heading>
            </HStack>
            <HStack spacing={2}>
              {hasChanges && (
                <Badge colorScheme="yellow">Unsaved changes</Badge>
              )}
              <Button
                leftIcon={<SaveIcon />}
                colorScheme="teal"
                size="sm"
                onClick={saveSettings}
                isDisabled={!hasChanges}
              >
                Save
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Sync Preferences */}
          <Card bg="surface.800" borderColor="surface.700">
            <CardHeader pb={0}>
              <Heading size="sm" color="white">Sync Preferences</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={5} align="stretch">
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0} color="white">Confirm production actions</FormLabel>
                    <Text fontSize="sm" color="surface.400">
                      Require confirmation when modifying production databases
                    </Text>
                  </Box>
                  <Switch
                    colorScheme="teal"
                    isChecked={settings.confirmProductionActions}
                    onChange={(e) => updateSetting('confirmProductionActions', e.target.checked)}
                  />
                </FormControl>

                <Divider borderColor="surface.700" />

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0} color="white">Auto-validate schema</FormLabel>
                    <Text fontSize="sm" color="surface.400">
                      Automatically check schema compatibility before sync
                    </Text>
                  </Box>
                  <Switch
                    colorScheme="teal"
                    isChecked={settings.autoValidateSchema}
                    onChange={(e) => updateSetting('autoValidateSchema', e.target.checked)}
                  />
                </FormControl>

                <Divider borderColor="surface.700" />

                <FormControl>
                  <FormLabel color="white">Default sync mode</FormLabel>
                  <Select
                    value={settings.defaultSyncMode}
                    onChange={(e) => updateSetting('defaultSyncMode', e.target.value as 'one_way' | 'two_way')}
                    bg="surface.900"
                    borderColor="surface.600"
                  >
                    <option value="one_way">One-Way Sync</option>
                    <option value="two_way">Two-Way Sync (when available)</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel color="white">Default conflict strategy</FormLabel>
                  <Select
                    value={settings.defaultConflictStrategy}
                    onChange={(e) => updateSetting('defaultConflictStrategy', e.target.value)}
                    bg="surface.900"
                    borderColor="surface.600"
                  >
                    <option value="last_write_wins">Last Write Wins</option>
                    <option value="source_wins">Source Always Wins</option>
                    <option value="target_wins">Target Always Wins</option>
                    <option value="manual">Manual Review</option>
                  </Select>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Display Preferences */}
          <Card bg="surface.800" borderColor="surface.700">
            <CardHeader pb={0}>
              <Heading size="sm" color="white">Display Preferences</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={5} align="stretch">
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0} color="white">Show row counts</FormLabel>
                    <Text fontSize="sm" color="surface.400">
                      Display estimated row counts in schema views
                    </Text>
                  </Box>
                  <Switch
                    colorScheme="teal"
                    isChecked={settings.showRowCounts}
                    onChange={(e) => updateSetting('showRowCounts', e.target.checked)}
                  />
                </FormControl>

                <Divider borderColor="surface.700" />

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0} color="white">Compact view</FormLabel>
                    <Text fontSize="sm" color="surface.400">
                      Use smaller spacing and font sizes
                    </Text>
                  </Box>
                  <Switch
                    colorScheme="teal"
                    isChecked={settings.compactView}
                    onChange={(e) => updateSetting('compactView', e.target.checked)}
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Security */}
          <Card bg="surface.800" borderColor="surface.700">
            <CardHeader pb={0}>
              <HStack>
                <KeyIcon />
                <Heading size="sm" color="white">Security</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="md" bg="blue.900">
                  <AlertIcon />
                  <Text fontSize="sm">
                    To change the admin password, update <Code bg="blue.800">ADMIN_PASSWORD_HASH</Code> in your <Code bg="blue.800">.env.local</Code> file.
                  </Text>
                </Alert>

                <FormControl>
                  <FormLabel color="white">New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      bg="surface.900"
                      borderColor="surface.600"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide' : 'Show'}
                        icon={showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel color="white">Confirm Password</FormLabel>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    bg="surface.900"
                    borderColor="surface.600"
                  />
                </FormControl>

                <Button
                  colorScheme="orange"
                  onClick={handlePasswordChange}
                  isDisabled={!newPassword || !confirmPassword}
                >
                  Generate Password Hash
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Danger Zone */}
          <Card bg="surface.800" borderColor="red.700" borderWidth="2px">
            <CardHeader pb={0}>
              <Heading size="sm" color="red.400">Danger Zone</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Box>
                    <Text color="white" fontWeight="medium">Reset all settings</Text>
                    <Text fontSize="sm" color="surface.400">
                      Restore all settings to their default values
                    </Text>
                  </Box>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    size="sm"
                    onClick={resetSettings}
                  >
                    Reset
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* System Info */}
          <Card bg="surface.800" borderColor="surface.700">
            <CardHeader pb={0}>
              <Heading size="sm" color="white">System Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text color="surface.400">Version</Text>
                  <Badge colorScheme="teal">1.0.0</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text color="surface.400">Environment</Text>
                  <Badge colorScheme="blue">{process.env.NODE_ENV || 'development'}</Badge>
                </HStack>
                <Divider borderColor="surface.700" my={2} />
                <Button
                  variant="link"
                  color="brand.400"
                  size="sm"
                  onClick={() => router.push('/status')}
                  justifyContent="flex-start"
                  rightIcon={<ArrowRightIcon />}
                >
                  View System Status
                </Button>
                <Button
                  variant="link"
                  color="brand.400"
                  size="sm"
                  onClick={() => router.push('/guide')}
                  justifyContent="flex-start"
                  rightIcon={<ArrowRightIcon />}
                >
                  View Documentation
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

