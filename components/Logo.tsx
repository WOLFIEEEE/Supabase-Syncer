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
          
          {/* Background circle with Supabase green */}
          <circle cx="24" cy="24" r="22" fill="url(#supaGrad)"/>
          
          {/* Letter "r" in center - reimagining */}
          <text 
            x="24" 
            y="24" 
            fontSize="28" 
            fontWeight="bold" 
            fill="white" 
            textAnchor="middle" 
            dominantBaseline="central"
            fontFamily="Inter, system-ui, -apple-system, sans-serif"
          >
            r
          </text>
          
          {/* Circular refresh arrows around the "r" */}
          <path 
            d="M 36 14 A 14 14 0 0 1 38 24" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
            opacity="0.6"
          />
          <path 
            d="M 38 24 L 35 22 M 38 24 L 36 27" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
            opacity="0.6"
          />
          
          <path 
            d="M 12 34 A 14 14 0 0 1 10 24" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
            opacity="0.6"
          />
          <path 
            d="M 10 24 L 13 26 M 10 24 L 12 21" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
            opacity="0.6"
          />
        </svg>
      </Box>
      
      {showText && variant === 'full' && (
        <HStack spacing={0.5}>
          <Text 
            fontSize={text} 
            fontWeight="medium" 
            color="surface.300"
            letterSpacing="-0.01em"
          >
            supa
          </Text>
          <Box
            px={1.5}
            py={0.5}
            bg="teal.500"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text 
              fontSize={text === 'md' ? 'lg' : text === 'lg' ? 'xl' : '2xl'} 
              fontWeight="extrabold" 
              color="white"
              letterSpacing="-0.02em"
            >
              r
            </Text>
          </Box>
          <Text 
            fontSize={text} 
            fontWeight="medium" 
            color="surface.300"
            letterSpacing="-0.01em"
          >
            base
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
          <linearGradient id="supaGradAnim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3ECF8E"/>
            <stop offset="100%" stopColor="#14B8A6"/>
          </linearGradient>
        </defs>
        
        <circle cx="24" cy="24" r="22" fill="url(#supaGradAnim)"/>
        
        <text 
          x="24" 
          y="24" 
          fontSize="28" 
          fontWeight="bold" 
          fill="white" 
          textAnchor="middle" 
          dominantBaseline="central"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
        >
          r
        </text>
        
        {/* Animated refresh arrows */}
        <path 
          d="M 36 14 A 14 14 0 0 1 38 24" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none"
          opacity="0.6"
        />
        <path 
          d="M 38 24 L 35 22 M 38 24 L 36 27" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none"
          opacity="0.6"
        />
        
        <path 
          d="M 12 34 A 14 14 0 0 1 10 24" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none"
          opacity="0.6"
        />
        <path 
          d="M 10 24 L 13 26 M 10 24 L 12 21" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none"
          opacity="0.6"
        />
      </svg>
    </Box>
  );
}

export default SuparbaseLogo;

