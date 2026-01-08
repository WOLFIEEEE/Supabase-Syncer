'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, BoxProps } from '@chakra-ui/react';

interface FlipCardProps extends BoxProps {
  front: React.ReactNode;
  back: React.ReactNode;
  flipOnHover?: boolean;
}

export default function FlipCard({
  front,
  back,
  flipOnHover = false,
  ...props
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <Box
      {...props}
      onMouseEnter={flipOnHover ? () => setIsFlipped(true) : undefined}
      onMouseLeave={flipOnHover ? () => setIsFlipped(false) : undefined}
      onClick={!flipOnHover ? () => setIsFlipped(!isFlipped) : undefined}
      style={{ perspective: '1000px' }}
      cursor={!flipOnHover ? 'pointer' : 'default'}
    >
      <motion.div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <Box
          position="absolute"
          width="100%"
          height="100%"
          style={{ 
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
        >
          {front}
        </Box>
        <Box
          position="absolute"
          width="100%"
          height="100%"
          style={{
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </Box>
      </motion.div>
    </Box>
  );
}

