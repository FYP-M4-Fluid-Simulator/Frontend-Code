'use client';

import { useEffect, useRef } from 'react';
import { generateAirfoil, rotateAirfoil } from '@/lib/cst';
import { calculatePotentialFlow, getPressureColor, isPointInsideAirfoil } from '@/lib/flowField';

interface EulerianFlowCanvasProps {
  width: number;
  height: number;
  upperCoefficients: number[];
  lowerCoefficients: number[];
  angleOfAttack: number;
  velocity: number;
  meshQuality: 'coarse' | 'medium' | 'fine' | 'ultra';
  showPressureField?: boolean;
  showVectorField?: boolean;
  showMeshOverlay?: boolean;
  showControlPoints?: boolean;
}

export function EulerianFlowCanvas({
  width,
  height,
  upperCoefficients,
  lowerCoefficients,
  angleOfAttack,
  velocity,
  meshQuality,
  showPressureField = true,
  showVectorField = true,
  showMeshOverlay = false,
  showControlPoints = false
}: EulerianFlowCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Generate airfoil geometry
    const { upper, lower } = generateAirfoil(upperCoefficients, lowerCoefficients, 100);
    const rotated = rotateAirfoil(upper, lower, angleOfAttack, 0.25);

    // Transform to canvas coordinates
    const scale = Math.min(width, height) * 0.5;
    const offsetX = width / 2;
    const offsetY = height / 2;

    const transformPoint = (p: { x: number; y: number }) => ({
      x: offsetX + (p.x - 0.5) * scale,
      y: offsetY - p.y * scale
    });

    const airfoilCanvasPoints = [...rotated.upper.map(transformPoint), ...rotated.lower.reverse().map(transformPoint)];

    // Grid spacing based on mesh quality
    const gridSpacing = {
      coarse: 40,
      medium: 25,
      fine: 15,
      ultra: 10
    }[meshQuality];

    const arrowScale = {
      coarse: 1.2,
      medium: 1.0,
      fine: 0.8,
      ultra: 0.6
    }[meshQuality];

    let animationTime = 0;

    const render = () => {
      animationTime += 0.016;

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw pressure field
      if (showPressureField) {
        for (let x = 0; x < width; x += gridSpacing / 2) {
          for (let y = 0; y < height; y += gridSpacing / 2) {
            // Transform to airfoil coordinate system
            const ax = ((x - offsetX) / scale) + 0.5;
            const ay = (offsetY - y) / scale;

            const flow = calculatePotentialFlow(
              ax,
              ay,
              [...rotated.upper, ...rotated.lower.reverse()],
              angleOfAttack,
              velocity
            );

            const color = getPressureColor(flow.pressure);
            
            // Draw pressure cell with glow
            const alpha = 0.4;
            ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
            ctx.fillRect(x, y, gridSpacing / 2, gridSpacing / 2);
          }
        }
      }

      // Draw vector field (flow arrows)
      if (showVectorField) {
        for (let x = gridSpacing; x < width - gridSpacing; x += gridSpacing) {
          for (let y = gridSpacing; y < height - gridSpacing; y += gridSpacing) {
            // Transform to airfoil coordinate system
            const ax = ((x - offsetX) / scale) + 0.5;
            const ay = (offsetY - y) / scale;

            const flow = calculatePotentialFlow(
              ax,
              ay,
              [...rotated.upper, ...rotated.lower.reverse()],
              angleOfAttack,
              velocity
            );

            // Skip if inside airfoil
            if (flow.speed === 0) continue;

            // Arrow direction and magnitude
            const speed = flow.speed;
            const angle = Math.atan2(flow.vy, flow.vx);
            const magnitude = Math.min(speed / velocity, 2) * 15 * arrowScale;

            // Animate arrow length
            const pulsePhase = (animationTime * 2 + x * 0.02 + y * 0.02) % (Math.PI * 2);
            const pulse = 0.8 + Math.sin(pulsePhase) * 0.2;

            const arrowLength = magnitude * pulse;
            const endX = x + Math.cos(angle) * arrowLength;
            const endY = y + Math.sin(angle) * arrowLength;

            // Color based on speed (neon glow)
            const speedRatio = Math.min(speed / (velocity * 1.5), 1);
            let arrowColor;
            
            if (speedRatio > 0.7) {
              // Fast flow - Electric Blue (low pressure)
              arrowColor = `rgba(0, 191, 255, 0.9)`; // Deep Sky Blue
            } else if (speedRatio < 0.3) {
              // Slow flow - Crimson Red (high pressure)
              arrowColor = `rgba(220, 20, 60, 0.9)`; // Crimson
            } else {
              // Medium flow - blend
              const t = (speedRatio - 0.3) / 0.4;
              const r = Math.floor(220 - t * 220);
              const g = Math.floor(20 + t * 171);
              const b = Math.floor(60 + t * 195);
              arrowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
            }

            // Draw arrow shaft with glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = arrowColor;
            ctx.strokeStyle = arrowColor;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Draw arrow head
            const headLength = 6 * arrowScale;
            const headAngle = Math.PI / 6;

            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLength * Math.cos(angle - headAngle),
              endY - headLength * Math.sin(angle - headAngle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLength * Math.cos(angle + headAngle),
              endY - headLength * Math.sin(angle + headAngle)
            );
            ctx.stroke();

            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw grid lines
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw airfoil shape with glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(airfoilCanvasPoints[0].x, airfoilCanvasPoints[0].y);
      for (let i = 1; i < airfoilCanvasPoints.length; i++) {
        ctx.lineTo(airfoilCanvasPoints[i].x, airfoilCanvasPoints[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Draw leading edge marker (stagnation point)
      const leadingEdge = transformPoint({ x: 0, y: 0 });
      ctx.fillStyle = '#dc143c'; // Crimson
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#dc143c';
      ctx.beginPath();
      ctx.arc(leadingEdge.x, leadingEdge.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw trailing edge marker
      const trailingEdge = transformPoint({ x: 1, y: 0 });
      ctx.fillStyle = '#00bfff'; // Deep Sky Blue
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00bfff';
      ctx.beginPath();
      ctx.arc(trailingEdge.x, trailingEdge.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, upperCoefficients, lowerCoefficients, angleOfAttack, velocity, meshQuality, showPressureField, showVectorField, showMeshOverlay, showControlPoints]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ imageRendering: 'auto' }}
    />
  );
}