'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Box, BoxProps } from '@chakra-ui/react';

interface ParallaxBoxProps extends BoxProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
}

export default function ParallaxBox({
  children,
  speed = 0.5,
  direction = 'up',
  ...props
}: ParallaxBoxProps) {
  const { scrollY } = useScroll();
  const y = useTransform(
    scrollY,
    [0, 1000],
    direction === 'up' ? [0, -1000 * speed] : [0, 1000 * speed]
  );

  return (
    <motion.div style={{ y }}>
      <Box {...props}>{children}</Box>
    </motion.div>
  );
}

