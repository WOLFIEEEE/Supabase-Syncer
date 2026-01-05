'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Flex,
  Heading,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

// Icons
const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

export type ActivityType = 'view' | 'insert' | 'update' | 'delete';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  table: string;
  connectionId: string;
  connectionName: string;
  rowId?: string;
  timestamp: string;
  details?: string;
}

const ACTIVITY_KEY = 'pulse-activity-feed';
const MAX_ITEMS = 50;

// Activity store functions
export function addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>) {
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY);
    const items: ActivityItem[] = stored ? JSON.parse(stored) : [];
    
    const newItem: ActivityItem = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    const updated = [newItem, ...items].slice(0, MAX_ITEMS);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('pulse-activity-update', { detail: newItem }));
    
    return newItem;
  } catch {
    return null;
  }
}

export function getActivities(): ActivityItem[] {
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function clearActivities() {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
    window.dispatchEvent(new CustomEvent('pulse-activity-update'));
  } catch {
    // Ignore
  }
}

// Component
interface ActivityFeedProps {
  connectionId?: string;
  maxItems?: number;
  showHeader?: boolean;
}

export default function ActivityFeed({
  connectionId,
  maxItems = 20,
  showHeader = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Load initial activities
    const loadActivities = () => {
      let items = getActivities();
      if (connectionId) {
        items = items.filter((a) => a.connectionId === connectionId);
      }
      setActivities(items.slice(0, maxItems));
    };
    
    loadActivities();
    
    // Listen for updates
    const handleUpdate = () => loadActivities();
    window.addEventListener('pulse-activity-update', handleUpdate);
    
    return () => window.removeEventListener('pulse-activity-update', handleUpdate);
  }, [connectionId, maxItems]);

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'view':
        return <EyeIcon />;
      case 'insert':
        return <PlusIcon />;
      case 'update':
        return <EditIcon />;
      case 'delete':
        return <TrashIcon />;
      default:
        return <EyeIcon />;
    }
  };

  const getTypeColor = (type: ActivityType) => {
    switch (type) {
      case 'view':
        return 'gray';
      case 'insert':
        return 'green';
      case 'update':
        return 'blue';
      case 'delete':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return 'Just now';
    }
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    return date.toLocaleDateString();
  };

  const handleClear = () => {
    clearActivities();
    setActivities([]);
  };

  if (activities.length === 0) {
    return (
      <Box p={4} bg="surface.800" borderRadius="lg" border="1px solid" borderColor="surface.700">
        <Text fontSize="sm" color="surface.500" textAlign="center">
          No recent activity
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      {showHeader && (
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="xs" color="surface.400">
            Recent Activity
          </Heading>
          <Tooltip label="Clear activity" hasArrow>
            <IconButton
              aria-label="Clear activity"
              icon={<ClearIcon />}
              size="xs"
              variant="ghost"
              onClick={handleClear}
            />
          </Tooltip>
        </Flex>
      )}
      
      <VStack
        spacing={0}
        align="stretch"
        bg="surface.800"
        borderRadius="lg"
        border="1px solid"
        borderColor="surface.700"
        overflow="hidden"
      >
        <AnimatePresence>
          {activities.map((activity, index) => (
            <MotionBox
              key={activity.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                px={3}
                py={2}
                borderBottomWidth={index < activities.length - 1 ? '1px' : 0}
                borderColor="surface.700"
                _hover={{ bg: 'surface.750' }}
                transition="background 0.2s"
              >
                <Flex justify="space-between" align="start">
                  <HStack spacing={2} align="start">
                    <Box
                      p={1}
                      borderRadius="md"
                      bg={`${getTypeColor(activity.type)}.900`}
                      color={`${getTypeColor(activity.type)}.400`}
                      mt={0.5}
                    >
                      {getTypeIcon(activity.type)}
                    </Box>
                    <VStack align="start" spacing={0}>
                      <HStack spacing={2}>
                        <Badge
                          colorScheme={getTypeColor(activity.type)}
                          variant="subtle"
                          fontSize="xs"
                          textTransform="uppercase"
                        >
                          {activity.type}
                        </Badge>
                        <Text fontSize="sm" color="white" fontWeight="medium">
                          {activity.table}
                        </Text>
                      </HStack>
                      {activity.details && (
                        <Text fontSize="xs" color="surface.500" noOfLines={1}>
                          {activity.details}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <Text fontSize="xs" color="surface.500" flexShrink={0}>
                    {formatTime(activity.timestamp)}
                  </Text>
                </Flex>
              </Box>
            </MotionBox>
          ))}
        </AnimatePresence>
      </VStack>
    </Box>
  );
}

