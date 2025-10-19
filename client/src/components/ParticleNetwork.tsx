import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/theme-provider';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
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

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = Math.min(Math.floor(window.innerWidth / 15), 80);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }
    particlesRef.current = particles;

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

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get theme-based colors
      const colors = isDark
        ? {
            particle: 'rgba(168, 85, 247, 0.6)', // purple-500
            particleGlow: 'rgba(168, 85, 247, 0.3)',
            line: 'rgba(217, 70, 239, 0.2)', // fuchsia-500
            lineStrong: 'rgba(217, 70, 239, 0.4)',
          }
        : {
            particle: 'rgba(100, 116, 139, 0.4)', // slate-500
            particleGlow: 'rgba(100, 116, 139, 0.1)',
            line: 'rgba(148, 163, 184, 0.15)', // slate-400
            lineStrong: 'rgba(148, 163, 184, 0.25)',
          };

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Add subtle scroll influence
        particle.y += scrollOffsetRef.current * 0.001;

        // Mouse interaction (subtle attraction/repulsion)
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150) {
          const force = (150 - distance) / 150;
          particle.vx -= (dx / distance) * force * 0.02;
          particle.vy -= (dy / distance) * force * 0.02;
        }

        // Boundary check with wrapping
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Damping
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Ensure minimum velocity
        if (Math.abs(particle.vx) < 0.1) particle.vx = (Math.random() - 0.5) * 0.2;
        if (Math.abs(particle.vy) < 0.1) particle.vy = (Math.random() - 0.5) * 0.2;

        // Draw connections
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = 1 - distance / 150;
            ctx.beginPath();
            ctx.strokeStyle = distance < 80 ? colors.lineStrong : colors.line;
            ctx.globalAlpha = opacity * 0.5;
            ctx.lineWidth = distance < 80 ? 1.5 : 1;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });

        // Draw particle with glow
        if (isDark) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius + 3, 0, Math.PI * 2);
          ctx.fillStyle = colors.particleGlow;
          ctx.fill();
        }

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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
