/**
 * Dashboard Widget Component
 * 
 * Wrapper for dashboard sections with drag-and-drop support
 */

'use client';

import {
  Box,
  IconButton,
  HStack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface DashboardWidgetProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isDraggable?: boolean;
}

const UpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const DownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function DashboardWidget({
  id,
  title,
  children,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  isDraggable = false,
}: DashboardWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <MotionBox
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Widget Controls (shown on hover) */}
      {isHovered && (onMoveUp || onMoveDown) && (
        <Box
          position="absolute"
          top={2}
          right={2}
          zIndex={10}
          bg="surface.800"
          borderRadius="md"
          p={1}
          border="1px solid"
          borderColor="surface.700"
        >
          <HStack spacing={1}>
            {onMoveUp && (
              <Tooltip label="Move up">
                <IconButton
                  aria-label="Move up"
                  icon={<UpIcon />}
                  size="xs"
                  variant="ghost"
                  color="white"
                  onClick={onMoveUp}
                  isDisabled={!canMoveUp}
                  _hover={{ bg: 'surface.700' }}
                />
              </Tooltip>
            )}
            {onMoveDown && (
              <Tooltip label="Move down">
                <IconButton
                  aria-label="Move down"
                  icon={<DownIcon />}
                  size="xs"
                  variant="ghost"
                  color="white"
                  onClick={onMoveDown}
                  isDisabled={!canMoveDown}
                  _hover={{ bg: 'surface.700' }}
                />
              </Tooltip>
            )}
          </HStack>
        </Box>
      )}

      {/* Widget Content */}
      <Box id={id}>
        {title && (
          <HStack mb={4} justify="space-between">
            <Text color="white" fontWeight="bold" fontSize="lg">
              {title}
            </Text>
          </HStack>
        )}
        {children}
      </Box>
    </MotionBox>
  );
}
