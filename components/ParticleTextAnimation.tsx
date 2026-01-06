'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Box } from '@chakra-ui/react';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  density: number;
  distance: number;
}

export default function ParticleTextAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // Recreate particles on resize
      initParticles();
    };

    const initParticles = () => {
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Clear and reset
      ctx.clearRect(0, 0, width, height);

      // Text configuration
      const text = 'suparbase.com';
      const fontSize = Math.min(width / 6, 160);
      ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
      ctx.fillStyle = '#3ECF8E';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Get text metrics
      const textX = width / 2;
      const textY = height / 2;

      // Draw text to get pixel data
      ctx.fillText(text, textX, textY);
      const textCoordinates = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Create particles from text pixels
      const particles: Particle[] = [];
      const gap = 4; // Gap between particles

      for (let y = 0; y < canvas.height; y += gap) {
        for (let x = 0; x < canvas.width; x += gap) {
          const index = (y * canvas.width + x) * 4;
          const alpha = textCoordinates.data[index + 3];

          if (alpha > 128) {
            particles.push({
              x: x / dpr,
              y: y / dpr,
              baseX: x / dpr,
              baseY: y / dpr,
              density: Math.random() * 30 + 10,
              distance: 0,
            });
          }
        }
      }

      particlesRef.current = particles;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setMouse(mouseRef.current);
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      mouseRef.current = { x: 0, y: 0 };
      setMouse({ x: 0, y: 0 });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.fillStyle = 'rgba(9, 9, 11, 0.1)';
      ctx.fillRect(0, 0, width, height);

      particlesRef.current.forEach((particle) => {
        // Calculate distance from mouse
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 100;
        const force = (mouseRef.current.x === 0 && mouseRef.current.y === 0) ? 0 : Math.max(0, (maxDistance - distance) / maxDistance);

        // Apply force
        if (distance < maxDistance && force > 0) {
          const angle = Math.atan2(dy, dx);
          const moveX = Math.cos(angle) * force * particle.density * 0.5;
          const moveY = Math.sin(angle) * force * particle.density * 0.5;

          particle.x -= moveX;
          particle.y -= moveY;
        } else {
          // Return to base position
          const dx2 = particle.baseX - particle.x;
          const dy2 = particle.baseY - particle.y;
          particle.x += dx2 * 0.05;
          particle.y += dy2 * 0.05;
        }

        // Draw particle with glow effect
        ctx.beginPath();
        const radius = 2;
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, radius
        );
        gradient.addColorStop(0, `rgba(62, 207, 142, ${0.9 + force * 0.1})`);
        gradient.addColorStop(0.5, `rgba(62, 207, 142, ${0.6 + force * 0.2})`);
        gradient.addColorStop(1, `rgba(62, 207, 142, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <Box
      w="100%"
      h={{ base: '200px', md: '300px' }}
      position="relative"
      bg="transparent"
      overflow="hidden"
      cursor="none"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </Box>
  );
}

