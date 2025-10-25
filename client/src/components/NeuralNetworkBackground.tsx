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
  colorHue: number; // Vibrant color variety
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

    // Vibrant color palette: purple, cyan, fuchsia, pink
    const colorHues = [280, 195, 320, 340]; // Electric purple, cyan, fuchsia, pink
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 4 + 4, // Slightly larger
        pulsePhase: Math.random() * Math.PI * 2,
        energy: Math.random() * 0.5 + 0.5, // Start with higher energy
        colorHue: colorHues[Math.floor(Math.random() * colorHues.length)],
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

        // Draw node with INTENSE glow
        const pulseSize = Math.sin(node.pulsePhase) * 0.6 + 1.2; // Bigger pulse
        const glowIntensity = 0.5 + node.energy * 0.5; // Always glowing

        // MASSIVE outer glow (4x radius)
        const glowGradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * pulseSize * 5
        );
        
        if (isDark) {
          glowGradient.addColorStop(0, `hsla(${node.colorHue}, 100%, 80%, ${glowIntensity})`);
          glowGradient.addColorStop(0.3, `hsla(${node.colorHue}, 100%, 70%, ${glowIntensity * 0.7})`);
          glowGradient.addColorStop(0.6, `hsla(${node.colorHue}, 100%, 60%, ${glowIntensity * 0.3})`);
          glowGradient.addColorStop(1, `hsla(${node.colorHue}, 100%, 50%, 0)`);
        } else {
          glowGradient.addColorStop(0, `hsla(${node.colorHue}, 100%, 65%, ${glowIntensity * 0.8})`);
          glowGradient.addColorStop(0.3, `hsla(${node.colorHue}, 100%, 55%, ${glowIntensity * 0.5})`);
          glowGradient.addColorStop(0.6, `hsla(${node.colorHue}, 100%, 45%, ${glowIntensity * 0.25})`);
          glowGradient.addColorStop(1, `hsla(${node.colorHue}, 100%, 40%, 0)`);
        }

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseSize * 5, 0, Math.PI * 2);
        ctx.fill();

        // Bright core node with 100% saturation
        ctx.fillStyle = isDark 
          ? `hsla(${node.colorHue}, 100%, 75%, ${0.9 + glowIntensity * 0.1})`
          : `hsla(${node.colorHue}, 100%, 60%, ${0.7 + glowIntensity * 0.2})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Electric white highlight (always bright)
        const highlightColor = node.colorHue === 195 ? 200 : 195; // Complementary highlight
        ctx.fillStyle = isDark
          ? `hsla(${highlightColor}, 100%, 95%, ${0.8 + glowIntensity * 0.2})`
          : `hsla(${highlightColor}, 100%, 85%, ${0.6 + glowIntensity * 0.3})`;
        ctx.beginPath();
        ctx.arc(node.x - node.radius * 0.3, node.y - node.radius * 0.3, node.radius * 0.5, 0, Math.PI * 2);
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

      // Draw VIBRANT connections with data flow
      connections.forEach(conn => {
        const avgEnergy = (conn.node1.energy + conn.node2.energy) / 2;
        const opacity = conn.strength * 0.6 * (0.5 + avgEnergy * 0.5); // Brighter connections

        // Rainbow gradient connection line
        const lineGradient = ctx.createLinearGradient(
          conn.node1.x, conn.node1.y,
          conn.node2.x, conn.node2.y
        );

        // Use node colors for gradient
        const color1 = conn.node1.colorHue;
        const color2 = conn.node2.colorHue;
        
        if (isDark) {
          lineGradient.addColorStop(0, `hsla(${color1}, 100%, 75%, ${opacity})`);
          lineGradient.addColorStop(0.5, `hsla(${(color1 + color2) / 2}, 100%, 70%, ${opacity})`);
          lineGradient.addColorStop(1, `hsla(${color2}, 100%, 75%, ${opacity})`);
        } else {
          lineGradient.addColorStop(0, `hsla(${color1}, 100%, 60%, ${opacity * 0.8})`);
          lineGradient.addColorStop(0.5, `hsla(${(color1 + color2) / 2}, 100%, 55%, ${opacity * 0.8})`);
          lineGradient.addColorStop(1, `hsla(${color2}, 100%, 60%, ${opacity * 0.8})`);
        }

        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 1.5 + conn.strength * 2.5; // Thicker lines
        ctx.beginPath();
        ctx.moveTo(conn.node1.x, conn.node1.y);
        ctx.lineTo(conn.node2.x, conn.node2.y);
        ctx.stroke();

        // BRIGHT data flow particles
        if (conn.strength > 0.4 && Math.random() < 0.08) { // More particles
          const flowPos = conn.dataFlow;
          const px = conn.node1.x + (conn.node2.x - conn.node1.x) * flowPos;
          const py = conn.node1.y + (conn.node2.y - conn.node1.y) * flowPos;

          // Glowing particle
          const particleGlow = ctx.createRadialGradient(px, py, 0, px, py, 4);
          particleGlow.addColorStop(0, isDark 
            ? `hsla(195, 100%, 95%, ${opacity * 3})` 
            : `hsla(195, 100%, 80%, ${opacity * 2})`);
          particleGlow.addColorStop(1, 'hsla(195, 100%, 50%, 0)');
          
          ctx.fillStyle = particleGlow;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
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
      style={{ opacity: isDark ? 0.85 : 0.55 }}
    />
  );
}
