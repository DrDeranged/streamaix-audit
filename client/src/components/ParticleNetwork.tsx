import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/theme-provider';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GeometricShape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  type: 'hexagon' | 'triangle' | 'square';
  opacity: number;
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shapesRef = useRef<GeometricShape[]>([]);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollOffsetRef = useRef(0);
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(true);

  // Update theme state
  useEffect(() => {
    setIsDark(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to cover entire document
    const resizeCanvas = () => {
      const newWidth = window.innerWidth;
      const newHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );
      
      // Only update if dimensions changed to avoid unnecessary redraws
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Update canvas height when content changes
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(document.body);
    
    // Continuously monitor canvas height to catch dynamic content changes
    const heightCheckInterval = setInterval(() => {
      resizeCanvas();
    }, 1000); // Check every second

    // Initialize particles (MORE and LARGER)
    const particleCount = Math.min(Math.floor(window.innerWidth / 8), 200);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5, // Balanced velocity for consistent motion
        vy: (Math.random() - 0.5) * 0.5, // Balanced velocity for consistent motion
        radius: Math.random() * 3 + 2, // Larger: 2-5px
      });
    }
    particlesRef.current = particles;

    // Initialize geometric shapes
    const shapeCount = Math.min(Math.floor(window.innerWidth / 300), 15);
    const shapes: GeometricShape[] = [];
    const shapeTypes: ('hexagon' | 'triangle' | 'square')[] = ['hexagon', 'triangle', 'square'];

    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        size: Math.random() * 30 + 20,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        opacity: Math.random() * 0.15 + 0.05,
      });
    }
    shapesRef.current = shapes;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY };
    };

    // Scroll handler
    const handleScroll = () => {
      scrollOffsetRef.current = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Helper function to draw geometric shapes
    const drawShape = (shape: GeometricShape, color: string) => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);
      ctx.globalAlpha = shape.opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      if (shape.type === 'hexagon') {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = shape.size * Math.cos(angle);
          const y = shape.size * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (shape.type === 'triangle') {
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
          const x = shape.size * Math.cos(angle);
          const y = shape.size * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
      }
      ctx.stroke();
      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get theme-based colors (STRONGER)
      const colors = isDark
        ? {
            particle: 'rgba(168, 85, 247, 0.9)', // purple-500 - more opaque
            particleGlow: 'rgba(168, 85, 247, 0.5)', // stronger glow
            line: 'rgba(217, 70, 239, 0.35)', // fuchsia-500 - more visible
            lineStrong: 'rgba(217, 70, 239, 0.6)',
            linePulse: 'rgba(6, 182, 212, 0.7)', // cyan-500 for pulsing lines
            shape: 'rgba(168, 85, 247, 0.3)',
          }
        : {
            particle: 'rgba(100, 116, 139, 0.6)', // slate-500
            particleGlow: 'rgba(100, 116, 139, 0.2)',
            line: 'rgba(148, 163, 184, 0.25)', // slate-400
            lineStrong: 'rgba(148, 163, 184, 0.4)',
            linePulse: 'rgba(100, 116, 139, 0.5)',
            shape: 'rgba(100, 116, 139, 0.2)',
          };

      // Update and draw geometric shapes
      shapes.forEach((shape) => {
        shape.x += shape.vx;
        shape.y += shape.vy;
        shape.rotation += shape.rotationSpeed;

        // Boundary check with wrapping
        if (shape.x < -100) shape.x = canvas.width + 100;
        if (shape.x > canvas.width + 100) shape.x = -100;
        if (shape.y < -100) shape.y = canvas.height + 100;
        if (shape.y > canvas.height + 100) shape.y = -100;

        drawShape(shape, colors.shape);
      });

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Mouse interaction (responsive repulsion)
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 250) {
          const force = (250 - distance) / 250;
          particle.vx -= (dx / distance) * force * 0.03; // Balanced for consistent interaction
          particle.vy -= (dy / distance) * force * 0.03;
        }

        // Boundary check with wrapping
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Balanced damping for lively motion
        particle.vx *= 0.99; // Lighter damping to maintain energy
        particle.vy *= 0.99; // Lighter damping to maintain energy

        // Ensure minimum velocity for continuous motion
        if (Math.abs(particle.vx) < 0.15) particle.vx = (Math.random() - 0.5) * 0.3;
        if (Math.abs(particle.vy) < 0.15) particle.vy = (Math.random() - 0.5) * 0.3;

        // Draw connections (LONGER distance, MORE visible)
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) { // Increased from 150
            const opacity = 1 - distance / 200;
            const pulseIntensity = Math.sin(Date.now() / 1000 + distance) * 0.3 + 0.7;
            
            ctx.beginPath();
            // Use pulsing color for very close connections
            if (distance < 100) {
              ctx.strokeStyle = colors.linePulse;
              ctx.globalAlpha = opacity * 0.8 * pulseIntensity;
              ctx.lineWidth = 2;
            } else if (distance < 150) {
              ctx.strokeStyle = colors.lineStrong;
              ctx.globalAlpha = opacity * 0.7;
              ctx.lineWidth = 1.5;
            } else {
              ctx.strokeStyle = colors.line;
              ctx.globalAlpha = opacity * 0.6;
              ctx.lineWidth = 1;
            }
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });

        // Draw particle with STRONGER glow
        if (isDark) {
          // Outer glow
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = colors.particleGlow;
          ctx.fill();
          
          // Inner glow
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius + 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
          ctx.fill();
        }

        // Draw particle core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.particle;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      clearInterval(heightCheckInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
