'use client';

import { HStack, Text, Box, VStack } from '@chakra-ui/react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  variant?: 'full' | 'icon';
}

const sizes = {
  sm: { icon: 24, text: 'md' as const },
  md: { icon: 32, text: 'lg' as const },
  lg: { icon: 40, text: 'xl' as const },
  xl: { icon: 48, text: '2xl' as const },
  '2xl': { icon: 64, text: 'lg' as const }, // Icon doubled, text stays same as 'md'
};

export function SuparbaseLogo({ size = 'md', showText = true, variant = 'full' }: LogoProps) {
  const { icon, text } = sizes[size];
  
  return (
    <HStack spacing={size === 'sm' ? 2 : 3} align="center">
      <Box 
        width={`${icon}px`} 
        height={`${icon}px`}
        position="relative"
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Image
          src="/logo.png"
          alt="suparbase logo"
          width={icon}
          height={icon}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          priority
        />
      </Box>
      
      {showText && variant === 'full' && (
        <VStack spacing={1} align="start">
          <HStack spacing={0} align="center">
            <Text 
              fontSize={text} 
              fontWeight="300" 
              color="white"
              letterSpacing="0.05em"
              opacity={0.9}
              lineHeight="1.2"
            >
              SUPA
            </Text>
            <Text 
              fontSize={text === 'md' ? 'lg' : text === 'lg' ? 'xl' : '2xl'} 
              fontWeight="900" 
              bgGradient="linear(to-br, #3ECF8E, #14B8A6)"
              bgClip="text"
              color="transparent"
              lineHeight="1.2"
              fontFamily="'Playfair Display', 'Georgia', serif"
              fontStyle="italic"
              mx={1.5}
            >
              R
            </Text>
            <Text 
              fontSize={text} 
              fontWeight="300" 
              color="white"
              letterSpacing="0.05em"
              opacity={0.9}
              lineHeight="1.2"
            >
              BASE
            </Text>
          </HStack>
          
          <Text 
            fontSize="xs" 
            fontWeight="400" 
            color="surface.400"
            letterSpacing="0.1em"
            textTransform="uppercase"
          >
            reimagining
          </Text>
        </VStack>
      )}
    </HStack>
  );
}

// Animated version for loading states
export function SuparbaseLogoAnimated({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const { icon } = sizes[size];
  
  return (
    <Box 
      width={`${icon}px`} 
      height={`${icon}px`}
      position="relative"
      className="pulse-logo-animated"
    >
      <style jsx global>{`
        .pulse-logo-animated {
          animation: supa-pulse 2s ease-in-out infinite;
        }
        @keyframes supa-pulse {
          0%, 100% { opacity: 0.8; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
      <Image
        src="/logo.png"
        alt="suparbase logo"
        width={icon}
        height={icon}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        priority
      />
    </Box>
  );
}

export default SuparbaseLogo;

