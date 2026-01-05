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
            <linearGradient id="supaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3ECF8E"/>
              <stop offset="100%" stopColor="#14B8A6"/>
            </linearGradient>
          </defs>
          
          {/* Stem of the 'r' - also looks like a data pillar */}
          <rect 
            x="14" 
            y="12" 
            width="6" 
            height="24" 
            rx="3" 
            fill="url(#supaGrad)"
          />
          
          {/* The reimagining bridge/shoulder */}
          <path 
            d="M20 18 C 26 18, 34 18, 34 28" 
            stroke="url(#supaGrad)" 
            strokeWidth="6" 
            strokeLinecap="round" 
          />
          
          {/* The node/target database point */}
          <circle 
            cx="34" 
            cy="34" 
            r="4" 
            fill="#3ECF8E"
          />
          
          {/* Subtle pulse ring around the node */}
          <circle 
            cx="34" 
            cy="34" 
            r="7" 
            stroke="#3ECF8E" 
            strokeWidth="1" 
            opacity="0.3"
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
              r
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
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: supa-draw 2s ease-in-out infinite;
        }
        .pulse-logo-animated .anim-node {
          animation: supa-pulse 2s ease-in-out infinite;
        }
        @keyframes supa-draw {
          0%, 100% { stroke-dashoffset: 50; }
          50% { stroke-dashoffset: 0; }
        }
        @keyframes supa-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
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
        </defs>
        
        {/* Animated Stem */}
        <rect 
          x="14" 
          y="12" 
          width="6" 
          height="24" 
          rx="3" 
          fill="url(#supaGradAnim)"
        />
        
        {/* Animated Bridge */}
        <path 
          d="M20 18 C 26 18, 34 18, 34 28" 
          stroke="url(#supaGradAnim)" 
          strokeWidth="6" 
          strokeLinecap="round"
          className="anim-path"
        />
        
        {/* Animated Node */}
        <circle 
          cx="34" 
          cy="34" 
          r="4" 
          fill="#3ECF8E"
          className="anim-node"
        />
      </svg>
    </Box>
  );
}

export default SuparbaseLogo;

