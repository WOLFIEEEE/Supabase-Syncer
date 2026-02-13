'use client';

import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  showTagline?: boolean;
  variant?: 'full' | 'icon' | 'wordmark';
  lockup?: 'stacked' | 'inline';
}

const sizes = {
  xs: { icon: 20, text: 'sm' as const, tag: '2xs' as const },
  sm: { icon: 24, text: 'md' as const, tag: 'xs' as const },
  md: { icon: 32, text: 'lg' as const, tag: 'xs' as const },
  lg: { icon: 38, text: 'xl' as const, tag: 'xs' as const },
  xl: { icon: 46, text: '2xl' as const, tag: 'sm' as const },
  '2xl': { icon: 58, text: '2xl' as const, tag: 'sm' as const },
};

export function SuparbaseLogo({
  size = 'md',
  showText = true,
  showTagline = true,
  variant = 'full',
  lockup = 'stacked',
}: LogoProps) {
  const { icon, text, tag } = sizes[size];
  const showWordmark = showText && variant !== 'icon';
  const isStacked = lockup === 'stacked';

  return (
    <HStack
      spacing={size === 'xs' || size === 'sm' ? 2 : 3}
      align={isStacked ? 'flex-start' : 'center'}
    >
      <Box
        width={`${icon}px`} 
        height={`${icon}px`}
        position="relative"
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="lg"
        overflow="hidden"
      >
        <Image
          src="/logo.png"
          alt="suparbase mark"
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

      {showWordmark && (
        <VStack spacing={isStacked ? 0 : 0.5} align="start">
          <HStack spacing={0} align="center" lineHeight="1">
            <Text
              fontSize={text}
              fontWeight="700"
              color="text.primary"
              letterSpacing="-0.01em"
              lineHeight="1"
              textTransform="lowercase"
              fontFamily="heading"
            >
              supa
            </Text>
            <Box
              mx={1}
              px={{ base: 1.5, md: 2 }}
              py={0.5}
              borderRadius="md"
              bgGradient="linear(125deg, #19c4a7, #1e84ff)"
              color="white"
              boxShadow="0 0 12px rgba(25, 196, 167, 0.45)"
              lineHeight="1"
            >
              <Text
                fontSize={text === 'sm' ? 'sm' : text === 'md' ? 'md' : 'lg'}
                fontWeight="900"
                lineHeight="1"
                fontFamily="mono"
              >
                R
              </Text>
            </Box>
            <Text
              fontSize={text}
              fontWeight="700"
              color="text.primary"
              letterSpacing="-0.01em"
              lineHeight="1"
              textTransform="lowercase"
              fontFamily="heading"
            >
              base
            </Text>
          </HStack>

          {showTagline && variant === 'full' && (
            <Text
              fontSize={tag}
              color="text.tertiary"
              letterSpacing="0.08em"
              textTransform="uppercase"
              fontWeight="600"
            >
              reimagining data sync
            </Text>
          )}
        </VStack>
      )}
    </HStack>
  );
}

export function SuparbaseLogoAnimated({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const { icon } = sizes[size];

  return (
    <Box 
      width={`${icon}px`} 
      height={`${icon}px`}
      position="relative"
      className="pulse-logo-animated"
      animation="pulse-logo 2s ease-in-out infinite"
    >
      <Image
        src="/logo.png"
        alt="suparbase mark"
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
