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
  '2xl': { icon: 64, text: '3xl' as const },
};

export function SuparbaseLogo({ size = 'md', showText = true, variant = 'full' }: LogoProps) {
  const { icon, text } = sizes[size];
  
  return (
    <VStack spacing={1} align="start">
      <HStack spacing={size === 'sm' ? 2 : 3}>
        <Box 
          width={`${icon}px`} 
          height={`${icon}px`}
          position="relative"
          flexShrink={0}
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
          <HStack spacing={0}>
            <Text 
              fontSize={text} 
              fontWeight="300" 
              color="white"
              letterSpacing="0.05em"
              opacity={0.9}
            >
              SUPA
            </Text>
            <Box
              mx={1.5}
              px={2}
              py={0.5}
              bgGradient="linear(to-br, #3ECF8E, #14B8A6)"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 0 15px rgba(62, 207, 142, 0.3)"
            >
              <Text 
                fontSize={text === 'md' ? 'lg' : text === 'lg' ? 'xl' : text === 'xl' ? '2xl' : '3xl'} 
                fontWeight="900" 
                color="white"
                lineHeight="1"
                fontFamily="JetBrains Mono, monospace"
              >
                R
              </Text>
            </Box>
            <Text 
              fontSize={text} 
              fontWeight="300" 
              color="white"
              letterSpacing="0.05em"
              opacity={0.9}
            >
              BASE
            </Text>
          </HStack>
        )}
      </HStack>
      
      {showText && variant === 'full' && (
        <Text 
          fontSize="xs" 
          fontWeight="400" 
          color="surface.400"
          letterSpacing="0.1em"
          textTransform="uppercase"
          ml={size === 'sm' ? `${icon + 8}px` : `${icon + 12}px`}
        >
          reimagining
        </Text>
      )}
    </VStack>
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

