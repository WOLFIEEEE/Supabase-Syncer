/**
 * Widget Settings Modal
 * 
 * Allows toggling widget visibility and resetting layout
 */

'use client';

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
  Text,
  Switch,
  FormControl,
  FormLabel,
  Divider,
} from '@chakra-ui/react';
import { WidgetId, WidgetConfig } from '@/lib/hooks/useDashboardWidgets';

interface WidgetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onToggleWidget: (widgetId: WidgetId) => void;
  onReset: () => void;
}

const WIDGET_LABELS: Record<WidgetId, string> = {
  'system-health': 'System Health',
  'real-time-metrics': 'Real-Time Metrics',
  'user-stats': 'User Statistics',
  'sync-stats': 'Sync Statistics',
  'security-overview': 'Security Overview',
  'recent-events': 'Recent Security Events',
  'user-growth-chart': 'User Growth Chart',
  'sync-performance-chart': 'Sync Performance Chart',
};

export default function WidgetSettings({
  isOpen,
  onClose,
  widgets,
  onToggleWidget,
  onReset,
}: WidgetSettingsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <ModalHeader color="white">Dashboard Widget Settings</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text color="surface.400" fontSize="sm">
              Toggle visibility of dashboard widgets
            </Text>
            <Divider borderColor="surface.700" />
            {widgets.map((widget) => (
              <FormControl key={widget.id} display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb={0} color="white" fontSize="sm">
                  {WIDGET_LABELS[widget.id]}
                </FormLabel>
                <Switch
                  colorScheme="teal"
                  isChecked={widget.visible}
                  onChange={() => onToggleWidget(widget.id)}
                />
              </FormControl>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onReset} color="white">
            Reset to Defaults
          </Button>
          <Button colorScheme="teal" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
