'use client';

import { motion } from 'framer-motion';
import { Box, BoxProps } from '@chakra-ui/react';

interface FloatingCardProps extends BoxProps {
  children: React.ReactNode;
  intensity?: number;
  duration?: number;
}

export default function FloatingCard({
  children,
  intensity = 10,
  duration = 3,
  ...props
}: FloatingCardProps) {
  return (
    <motion.div
      animate={{
        y: [0, -intensity, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Box {...props}>{children}</Box>
    </motion.div>
  );
}
