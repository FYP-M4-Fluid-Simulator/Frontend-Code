import { useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface TurbineVisualizationProps {
  liftToDragRatio: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function TurbineVisualization({ liftToDragRatio, isFullscreen, onToggleFullscreen }: TurbineVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Rotation speed based on L/D ratio (higher L/D = faster rotation)
    const rotationSpeed = (liftToDragRatio / 50) * 0.02;

    const drawScene = () => {
      // Clear canvas with sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, '#1e3a8a');
      skyGradient.addColorStop(0.5, '#3b82f6');
      skyGradient.addColorStop(1, '#93c5fd');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw clouds
      drawCloud(ctx, 150, 100, 80);
      drawCloud(ctx, 400, 150, 60);
      drawCloud(ctx, 700, 80, 90);
      drawCloud(ctx, 1000, 120, 70);

      // Draw ground
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, height - 150, width, 150);

      // Draw grass texture
      ctx.fillStyle = '#15803d';
      for (let i = 0; i < width; i += 20) {
        ctx.fillRect(i, height - 150, 10, 5);
        ctx.fillRect(i + 5, height - 145, 8, 4);
      }

      // Draw hills in background
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(0, height - 150);
      ctx.quadraticCurveTo(200, height - 250, 400, height - 150);
      ctx.quadraticCurveTo(600, height - 200, 800, height - 150);
      ctx.quadraticCurveTo(1000, height - 230, 1200, height - 150);
      ctx.fill();

      // Wind turbine position
      const turbineX = width / 2;
      const turbineY = height - 150;
      const towerHeight = 250;
      const hubRadius = 15;
      const bladeLength = 120;

      // Draw tower shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(turbineX + 10, turbineY, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw tower
      const towerGradient = ctx.createLinearGradient(
        turbineX - 15,
        0,
        turbineX + 15,
        0
      );
      towerGradient.addColorStop(0, '#9ca3af');
      towerGradient.addColorStop(0.5, '#e5e7eb');
      towerGradient.addColorStop(1, '#6b7280');
      ctx.fillStyle = towerGradient;
      
      ctx.beginPath();
      ctx.moveTo(turbineX - 15, turbineY);
      ctx.lineTo(turbineX - 8, turbineY - towerHeight);
      ctx.lineTo(turbineX + 8, turbineY - towerHeight);
      ctx.lineTo(turbineX + 15, turbineY);
      ctx.closePath();
      ctx.fill();

      // Tower highlights
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(turbineX - 7, turbineY - towerHeight);
      ctx.lineTo(turbineX - 14, turbineY);
      ctx.stroke();

      // Hub center
      const hubX = turbineX;
      const hubY = turbineY - towerHeight;

      // Draw nacelle (housing)
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(hubX - 25, hubY - 12, 50, 24);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(hubX - 25, hubY - 12, 50, 12);

      // Draw rotor blades
      ctx.save();
      ctx.translate(hubX, hubY);
      ctx.rotate(rotationRef.current);

      // Draw 3 blades
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3);

        // Blade shadow/depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(bladeLength / 2, -8, bladeLength, -3);
        ctx.lineTo(bladeLength, 3);
        ctx.quadraticCurveTo(bladeLength / 2, 8, 0, 0);
        ctx.fill();

        // Blade
        const bladeGradient = ctx.createLinearGradient(0, -5, 0, 5);
        bladeGradient.addColorStop(0, '#f9fafb');
        bladeGradient.addColorStop(0.5, '#ffffff');
        bladeGradient.addColorStop(1, '#e5e7eb');
        ctx.fillStyle = bladeGradient;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(bladeLength / 2, -6, bladeLength, -2);
        ctx.lineTo(bladeLength, 2);
        ctx.quadraticCurveTo(bladeLength / 2, 6, 0, 0);
        ctx.fill();

        // Blade outline
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Blade highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.quadraticCurveTo(bladeLength / 2, -4, bladeLength - 5, -1);
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();

      // Draw hub (center cap)
      const hubGradient = ctx.createRadialGradient(hubX, hubY, 0, hubX, hubY, hubRadius);
      hubGradient.addColorStop(0, '#f3f4f6');
      hubGradient.addColorStop(0.7, '#d1d5db');
      hubGradient.addColorStop(1, '#9ca3af');
      ctx.fillStyle = hubGradient;
      ctx.beginPath();
      ctx.arc(hubX, hubY, hubRadius, 0, Math.PI * 2);
      ctx.fill();

      // Hub shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(hubX - 3, hubY - 3, hubRadius / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw wind speed indicator
      drawWindIndicator(ctx, 100, 100, liftToDragRatio);

      // Performance indicator
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(20, height - 100, 250, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Performance Metrics', 30, height - 75);
      ctx.font = '12px sans-serif';
      ctx.fillText(`L/D Ratio: ${liftToDragRatio.toFixed(1)}`, 30, height - 55);
      ctx.fillText(`RPM: ${(liftToDragRatio * 0.12).toFixed(1)}`, 30, height - 35);
      
      // Performance bar
      const perfWidth = (liftToDragRatio / 100) * 220;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(30, height - 25, perfWidth, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(30, height - 25, 220, 8);

      // Update rotation
      rotationRef.current += rotationSpeed;

      // Continue animation
      animationRef.current = requestAnimationFrame(drawScene);
    };

    drawScene();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [liftToDragRatio]);

  return (
    <div className={`flex-1 flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-300 relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        className="max-w-full max-h-full"
      />
      <button
        onClick={onToggleFullscreen}
        className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>
    </div>
  );
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.6, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x + size * 0.2, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawWindIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, strength: number) {
  // Wind lines showing flow
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  
  const numLines = 5;
  const speed = strength / 10;
  
  for (let i = 0; i < numLines; i++) {
    const yPos = y + i * 15;
    const offset = (Date.now() / 1000 * speed * 50 + i * 20) % 100;
    
    ctx.beginPath();
    ctx.moveTo(x + offset, yPos);
    ctx.lineTo(x + offset + 30, yPos);
    ctx.stroke();
    
    // Arrow
    ctx.beginPath();
    ctx.moveTo(x + offset + 30, yPos);
    ctx.lineTo(x + offset + 25, yPos - 3);
    ctx.moveTo(x + offset + 30, yPos);
    ctx.lineTo(x + offset + 25, yPos + 3);
    ctx.stroke();
  }
}