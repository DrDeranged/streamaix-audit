import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/theme-provider';

interface NeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  energy: number;
}

interface Connection {
  node1: NeuralNode;
  node2: NeuralNode;
  strength: number;
  dataFlow: number;
}

export function NeuralNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<NeuralNode[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize neural nodes
    const nodeCount = Math.min(Math.floor(window.innerWidth / 12), 80);
    const nodes: NeuralNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 4 + 3,
        pulsePhase: Math.random() * Math.PI * 2,
        energy: Math.random(),
      });
    }
    nodesRef.current = nodes;

    // Mouse move handler with interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Energize nearby nodes
      nodes.forEach(node => {
        const dx = node.x - e.clientX;
        const dy = node.y - e.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          node.energy = Math.min(1, node.energy + 0.1);
          // Push nodes away slightly
          const force = (150 - distance) / 150;
          node.vx += (dx / distance) * force * 0.5;
          node.vy += (dy / distance) * force * 0.5;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Damping for smooth motion
        node.vx *= 0.98;
        node.vy *= 0.98;

        // Keep minimum velocity
        if (Math.abs(node.vx) < 0.1) node.vx += (Math.random() - 0.5) * 0.05;
        if (Math.abs(node.vy) < 0.1) node.vy += (Math.random() - 0.5) * 0.05;

        // Wrap around edges
        if (node.x < 0) node.x = canvas.width;
        if (node.x > canvas.width) node.x = 0;
        if (node.y < 0) node.y = canvas.height;
        if (node.y > canvas.height) node.y = 0;

        // Update pulse phase
        node.pulsePhase += 0.05;

        // Decay energy
        node.energy *= 0.98;

        // Draw node with glow
        const pulseSize = Math.sin(node.pulsePhase) * 0.5 + 1;
        const glowIntensity = 0.3 + node.energy * 0.7;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * pulseSize * 3
        );
        
        if (isDark) {
          gradient.addColorStop(0, `hsla(258, 84%, 70%, ${glowIntensity * 0.8})`);
          gradient.addColorStop(0.5, `hsla(195, 100%, 60%, ${glowIntensity * 0.3})`);
          gradient.addColorStop(1, 'hsla(258, 84%, 58%, 0)');
        } else {
          gradient.addColorStop(0, `hsla(258, 84%, 50%, ${glowIntensity * 0.4})`);
          gradient.addColorStop(0.5, `hsla(195, 100%, 50%, ${glowIntensity * 0.15})`);
          gradient.addColorStop(1, 'hsla(258, 84%, 58%, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseSize * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core node
        ctx.fillStyle = isDark 
          ? `hsla(258, 84%, 70%, ${0.6 + glowIntensity * 0.4})`
          : `hsla(258, 84%, 50%, ${0.3 + glowIntensity * 0.2})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = isDark
          ? `hsla(195, 100%, 80%, ${0.4 + glowIntensity * 0.6})`
          : `hsla(195, 100%, 60%, ${0.2 + glowIntensity * 0.3})`;
        ctx.beginPath();
        ctx.arc(node.x - node.radius * 0.3, node.y - node.radius * 0.3, node.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections between nearby nodes
      const connections: Connection[] = [];
      const maxDistance = 180;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const strength = 1 - (distance / maxDistance);
            connections.push({
              node1: nodes[i],
              node2: nodes[j],
              strength,
              dataFlow: (Math.sin(Date.now() * 0.001 + i + j) + 1) / 2,
            });
          }
        }
      }

      connectionsRef.current = connections;

      // Draw connections with data flow
      connections.forEach(conn => {
        const avgEnergy = (conn.node1.energy + conn.node2.energy) / 2;
        const opacity = conn.strength * 0.4 * (0.3 + avgEnergy * 0.7);

        // Connection line
        const gradient = ctx.createLinearGradient(
          conn.node1.x, conn.node1.y,
          conn.node2.x, conn.node2.y
        );

        if (isDark) {
          gradient.addColorStop(0, `hsla(258, 84%, 70%, ${opacity})`);
          gradient.addColorStop(0.5, `hsla(195, 100%, 60%, ${opacity * 0.8})`);
          gradient.addColorStop(1, `hsla(258, 84%, 70%, ${opacity})`);
        } else {
          gradient.addColorStop(0, `hsla(258, 84%, 50%, ${opacity * 0.5})`);
          gradient.addColorStop(0.5, `hsla(195, 100%, 50%, ${opacity * 0.4})`);
          gradient.addColorStop(1, `hsla(258, 84%, 50%, ${opacity * 0.5})`);
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + conn.strength * 2;
        ctx.beginPath();
        ctx.moveTo(conn.node1.x, conn.node1.y);
        ctx.lineTo(conn.node2.x, conn.node2.y);
        ctx.stroke();

        // Data flow particles
        if (conn.strength > 0.5 && Math.random() < 0.05) {
          const flowPos = conn.dataFlow;
          const px = conn.node1.x + (conn.node2.x - conn.node1.x) * flowPos;
          const py = conn.node1.y + (conn.node2.y - conn.node1.y) * flowPos;

          ctx.fillStyle = isDark
            ? `hsla(195, 100%, 80%, ${opacity * 2})`
            : `hsla(195, 100%, 60%, ${opacity})`;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: isDark ? 0.6 : 0.3 }}
    />
  );
}
