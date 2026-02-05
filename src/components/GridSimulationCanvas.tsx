'use client';

import { useEffect, useRef } from 'react';

interface GridSimulationCanvasProps {
  width: number;
  height: number;
  velocity: number;
  angleOfAttack: number;
  airfoilPath?: { upper: { x: number; y: number }[]; lower: { x: number; y: number }[] };
  showFlow?: boolean;
}

export function GridSimulationCanvas({
  width,
  height,
  velocity,
  angleOfAttack,
  airfoilPath,
  showFlow = false
}: GridSimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    canvas.width = width;
    canvas.height = height;

    const gridSpacing = 20;
    const cols = Math.floor(width / gridSpacing);
    const rows = Math.floor(height / gridSpacing);

    const animate = () => {
      timeRef.current += 0.016; // ~60fps

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#fee2e2'); // red-100
      gradient.addColorStop(0.5, '#f3f4f6'); // gray-100
      gradient.addColorStop(1, '#dbeafe'); // blue-100
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw grid mesh
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSpacing;
          const y = j * gridSpacing;

          // Calculate distance from center
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = Math.sqrt(width * width + height * height) / 2;
          const normalizedDistance = distance / maxDistance;

          // Calculate flow influence
          const flowAngle = (angleOfAttack * Math.PI) / 180;
          const flowX = Math.cos(flowAngle) * velocity;
          const flowY = Math.sin(flowAngle) * velocity;

          // Velocity magnitude (creates red to blue gradient)
          const velocityMagnitude = Math.sqrt(flowX * flowX + flowY * flowY);
          const normalizedVelocity = Math.min(velocityMagnitude / 100, 1);

          // Color based on velocity (red = high, blue = low)
          const r = Math.floor(255 * normalizedVelocity);
          const b = Math.floor(255 * (1 - normalizedVelocity));
          const g = 100;

          // Grid point
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();

          // Grid lines
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
          ctx.lineWidth = 0.5;
          
          if (i < cols - 1) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + gridSpacing, y);
            ctx.stroke();
          }
          
          if (j < rows - 1) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + gridSpacing);
            ctx.stroke();
          }

          // Flow arrows (if enabled)
          if (showFlow && i % 3 === 0 && j % 3 === 0) {
            const time = timeRef.current;
            const phase = (x / width + time * 0.5) % 1;
            
            const arrowLength = 10 + Math.sin(time * 2 + i * 0.1 + j * 0.1) * 3;
            const arrowX = x + Math.cos(flowAngle) * arrowLength * phase;
            const arrowY = y + Math.sin(flowAngle) * arrowLength * phase;

            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.4 * phase})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(arrowX, arrowY);
            ctx.stroke();

            // Arrow head
            const headLength = 4;
            const headAngle = Math.PI / 6;
            
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
              arrowX - headLength * Math.cos(flowAngle - headAngle),
              arrowY - headLength * Math.sin(flowAngle - headAngle)
            );
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
              arrowX - headLength * Math.cos(flowAngle + headAngle),
              arrowY - headLength * Math.sin(flowAngle + headAngle)
            );
            ctx.stroke();
          }
        }
      }

      // Draw velocity field intensity overlay
      if (showFlow) {
        const overlayGradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.max(width, height) / 2
        );
        overlayGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)'); // blue
        overlayGradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)'); // red
        
        ctx.fillStyle = overlayGradient;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, velocity, angleOfAttack, showFlow]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}
