'use client';

import { Box } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';

function generateBlobPath(time: number, index: number): string {
  const numPoints = 12;
  const centerX = [20, 80, 50][index] || 50;
  const centerY = [30, 30, 80][index] || 50;
  const baseRadius = [25, 30, 28][index] || 25;

  const path: string[] = [];

  for (let i = 0; i <= numPoints; i += 1) {
    const angle = (i / numPoints) * Math.PI * 2;
    const t = time * 0.3 + index * 0.5;

    const variation1 = Math.sin(angle * 2 + t) * 6;
    const variation2 = Math.cos(angle * 3 - t * 0.7) * 4;
    const variation3 = Math.sin(angle * 4 + t * 1.2) * 3;
    const variation = variation1 + variation2 + variation3;

    const driftX = Math.sin(t * 0.2 + index) * 8;
    const driftY = Math.cos(t * 0.25 + index) * 6;

    const radius = baseRadius + variation;
    const x = centerX + Math.cos(angle) * radius + driftX;
    const y = centerY + Math.sin(angle) * radius + driftY;

    if (i === 0) {
      path.push(`M ${x} ${y}`);
    } else {
      const prevAngle = ((i - 1) / numPoints) * Math.PI * 2;
      const prevT = time * 0.3 + index * 0.5;
      const prevVariation1 = Math.sin(prevAngle * 2 + prevT) * 6;
      const prevVariation2 = Math.cos(prevAngle * 3 - prevT * 0.7) * 4;
      const prevVariation3 = Math.sin(prevAngle * 4 + prevT * 1.2) * 3;
      const prevVariation = prevVariation1 + prevVariation2 + prevVariation3;
      const prevRadius = baseRadius + prevVariation;
      const prevX = centerX + Math.cos(prevAngle) * prevRadius + driftX;
      const prevY = centerY + Math.sin(prevAngle) * prevRadius + driftY;

      const cp1x = prevX + (x - prevX) * 0.5;
      const cp1y = prevY + (y - prevY) * 0.5;

      if (i === 1) {
        path.push(`L ${x} ${y}`);
      } else {
        path.push(`Q ${cp1x} ${cp1y} ${x} ${y}`);
      }
    }
  }

  path.push('Z');
  return path.join(' ');
}

export default function AnimatedBlobBackground() {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const paths = svg.querySelectorAll('path');
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) * 0.001;

      paths.forEach((path, index) => {
        const pathData = generateBlobPath(elapsed, index);
        path.setAttribute('d', pathData);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none" zIndex={0} opacity={0.2}>
      <Box
        as="svg"
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <path d="M 20 30 L 20 30 Z" fill="url(#gradient1)" style={{ filter: 'blur(50px)' }} />
        <path d="M 80 30 L 80 30 Z" fill="url(#gradient2)" style={{ filter: 'blur(50px)' }} />
        <path d="M 50 80 L 50 80 Z" fill="url(#gradient3)" style={{ filter: 'blur(50px)' }} />

        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#19C4A7" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#1E84FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#19C4A7" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E84FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#7E5BEF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1E84FF" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="gradient3" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#7E5BEF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#19C4A7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7E5BEF" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </Box>
    </Box>
  );
}
