'use client';

import { motion } from 'framer-motion';
import { Box, BoxProps } from '@chakra-ui/react';

interface GlassCardProps extends BoxProps {
  children: React.ReactNode;
  hover?: boolean;
  tilt?: boolean;
}

export default function GlassCard({
  children,
  hover = true,
  tilt = true,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? {
        scale: 1.02,
        rotateX: tilt ? 5 : 0,
        rotateY: tilt ? 5 : 0,
        transition: { duration: 0.3 },
      } : {}}
      style={{
        perspective: 1000,
      }}
    >
      <Box
        backdropFilter="blur(20px)"
        bg="rgba(255, 255, 255, 0.05)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        borderRadius="xl"
        boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.37)"
        {...props}
      >
        {children}
      </Box>
    </motion.div>
  );
}

