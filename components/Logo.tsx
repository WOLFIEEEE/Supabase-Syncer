'use client';

import { HStack, Text, Box, VStack } from '@chakra-ui/react';

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
        >
        <svg 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="supaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3ECF8E"/>
              <stop offset="100%" stopColor="#14B8A6"/>
            </linearGradient>
            <linearGradient id="supaGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5EEAD4"/>
              <stop offset="100%" stopColor="#3ECF8E"/>
            </linearGradient>
          </defs>
          
          {/* Modern stylized 'R' - clean and bold */}
          {/* Vertical stem */}
          <rect 
            x="12" 
            y="10" 
            width="5" 
            height="28" 
            rx="2.5" 
            fill="url(#supaGrad)"
          />
          
          {/* Top horizontal bar */}
          <rect 
            x="12" 
            y="10" 
            width="18" 
            height="5" 
            rx="2.5" 
            fill="url(#supaGrad)"
          />
          
          {/* Middle horizontal bar */}
          <rect 
            x="12" 
            y="20" 
            width="12" 
            height="5" 
            rx="2.5" 
            fill="url(#supaGrad)"
          />
          
          {/* Diagonal leg - reimagining curve */}
          <path 
            d="M 17 25 L 30 38" 
            stroke="url(#supaGrad)" 
            strokeWidth="5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Sync arrow on the diagonal - represents reimagining */}
          <path 
            d="M 26 32 L 30 38 L 28 36" 
            stroke="url(#supaGradLight)" 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Small accent dot at the end */}
          <circle 
            cx="30" 
            cy="38" 
            r="3" 
            fill="#5EEAD4"
          />
        </svg>
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
                fontSize={text === 'md' ? 'lg' : text === 'lg' ? 'xl' : '2xl'} 
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
        .pulse-logo-animated .anim-path {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: supa-draw 2s ease-in-out infinite;
        }
        .pulse-logo-animated .anim-arrow {
          animation: supa-arrow 2s ease-in-out infinite;
        }
        .pulse-logo-animated .anim-node {
          animation: supa-pulse 2s ease-in-out infinite;
        }
        @keyframes supa-draw {
          0%, 100% { stroke-dashoffset: 20; opacity: 0.6; }
          50% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes supa-arrow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes supa-pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
      <svg 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="supaGradAnim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3ECF8E"/>
            <stop offset="100%" stopColor="#14B8A6"/>
          </linearGradient>
          <linearGradient id="supaGradLightAnim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5EEAD4"/>
            <stop offset="100%" stopColor="#3ECF8E"/>
          </linearGradient>
        </defs>
        
        {/* Animated vertical stem */}
        <rect 
          x="12" 
          y="10" 
          width="5" 
          height="28" 
          rx="2.5" 
          fill="url(#supaGradAnim)"
        />
        
        {/* Animated top bar */}
        <rect 
          x="12" 
          y="10" 
          width="18" 
          height="5" 
          rx="2.5" 
          fill="url(#supaGradAnim)"
        />
        
        {/* Animated middle bar */}
        <rect 
          x="12" 
          y="20" 
          width="12" 
          height="5" 
          rx="2.5" 
          fill="url(#supaGradAnim)"
        />
        
        {/* Animated diagonal leg */}
        <path 
          d="M 17 25 L 30 38" 
          stroke="url(#supaGradAnim)" 
          strokeWidth="5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-path"
        />
        
        {/* Animated sync arrow */}
        <path 
          d="M 26 32 L 30 38 L 28 36" 
          stroke="url(#supaGradLightAnim)" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="anim-arrow"
        />
        
        {/* Animated accent dot */}
        <circle 
          cx="30" 
          cy="38" 
          r="3" 
          fill="#5EEAD4"
          className="anim-node"
        />
      </svg>
    </Box>
  );
}

export default SuparbaseLogo;

