'use client';

import { HStack, Text, Box, VStack } from '@chakra-ui/react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'full' | 'icon';
}

const sizes = {
  sm: { icon: 24, text: 'md' as const },
  md: { icon: 32, text: 'lg' as const },
  lg: { icon: 40, text: 'xl' as const },
  xl: { icon: 48, text: '2xl' as const },
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
              px={1}
              py={0.5}
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              <Box
                width={text === 'md' ? '28px' : text === 'lg' ? '36px' : '44px'}
                height={text === 'md' ? '28px' : text === 'lg' ? '36px' : '44px'}
                position="relative"
              >
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '100%', height: '100%' }}
                  className="electric-r"
                >
                  <defs>
                    <linearGradient id="electricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0D9488" />
                      <stop offset="50%" stopColor="#14B8A6" />
                      <stop offset="100%" stopColor="#0D9488" />
                    </linearGradient>
                  </defs>
                  
                  {/* Electric R - Vertical stem */}
                  <rect x="10" y="8" width="4" height="32" rx="2" fill="url(#electricGrad)" />
                  
                  {/* Top bar */}
                  <rect x="10" y="8" width="20" height="4" rx="2" fill="url(#electricGrad)" />
                  
                  {/* Middle bar */}
                  <rect x="10" y="20" width="14" height="4" rx="2" fill="url(#electricGrad)" />
                  
                  {/* Diagonal leg with electric effect */}
                  <path
                    d="M 14 24 L 28 40"
                    stroke="url(#electricGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="electric-path"
                  />
                  
                  {/* Electric sparks/zigzag on the diagonal */}
                  <path
                    d="M 16 28 L 18 26 L 20 30 L 22 28 L 24 32 L 26 30"
                    stroke="#5EEAD4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.8"
                    className="electric-spark"
                  />
                  
                  {/* Electric glow effect */}
                  <path
                    d="M 14 24 L 28 40"
                    stroke="#5EEAD4"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                    className="electric-glow"
                  />
                </svg>
                <style jsx>{`
                  .electric-r .electric-path {
                    filter: drop-shadow(0 0 2px #14B8A6);
                    animation: electric-pulse 2s ease-in-out infinite;
                  }
                  .electric-r .electric-spark {
                    animation: electric-flicker 0.5s ease-in-out infinite;
                  }
                  .electric-r .electric-glow {
                    animation: electric-pulse 2s ease-in-out infinite;
                  }
                  @keyframes electric-pulse {
                    0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 2px #14B8A6); }
                    50% { opacity: 1; filter: drop-shadow(0 0 4px #5EEAD4); }
                  }
                  @keyframes electric-flicker {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                  }
                `}</style>
              </Box>
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

