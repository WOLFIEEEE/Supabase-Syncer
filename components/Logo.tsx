'use client';

import { HStack, Text, Box } from '@chakra-ui/react';

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
    <HStack spacing={size === 'sm' ? 2 : 3}>
      <Box 
        width={`${icon}px`} 
        height={`${icon}px`}
        position="relative"
      >
        <svg 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6"/>
              <stop offset="100%" stopColor="#0D9488"/>
            </linearGradient>
            <linearGradient id="lineGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#5EEAD4"/>
              <stop offset="50%" stopColor="#2DD4BF"/>
              <stop offset="100%" stopColor="#5EEAD4"/>
            </linearGradient>
          </defs>
          
          {/* Main circle */}
          <circle cx="24" cy="24" r="22" fill="url(#pulseGrad)"/>
          
          {/* suparbase line */}
          <path 
            d="M8 24 L14 24 L17 18 L20 30 L24 12 L28 36 L31 18 L34 24 L40 24" 
            stroke="url(#lineGrad)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Peak glow */}
          <circle cx="24" cy="12" r="2" fill="#5EEAD4" opacity="0.6"/>
        </svg>
      </Box>
      
      {showText && variant === 'full' && (
        <Text 
          fontSize={text} 
          fontWeight="bold" 
          color="white"
          letterSpacing="-0.02em"
        >
          suparbase
        </Text>
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
        .pulse-logo-animated svg path {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: pulse-draw 1.5s ease-in-out infinite;
        }
        @keyframes pulse-draw {
          0% { stroke-dashoffset: 200; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -200; }
        }
      `}</style>
      <svg 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="pulseGradAnim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6"/>
            <stop offset="100%" stopColor="#0D9488"/>
          </linearGradient>
          <linearGradient id="lineGradAnim" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#5EEAD4"/>
            <stop offset="50%" stopColor="#2DD4BF"/>
            <stop offset="100%" stopColor="#5EEAD4"/>
          </linearGradient>
        </defs>
        
        <circle cx="24" cy="24" r="22" fill="url(#pulseGradAnim)"/>
        
        <path 
          d="M8 24 L14 24 L17 18 L20 30 L24 12 L28 36 L31 18 L34 24 L40 24" 
          stroke="url(#lineGradAnim)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </Box>
  );
}

export default SuparbaseLogo;

