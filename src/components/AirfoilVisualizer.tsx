'use client';

import { useState, useRef, useEffect } from 'react';

interface ControlPoint {
  id: number;
  value: number;
}

interface AirfoilVisualizerProps {
  upperControlPoints: ControlPoint[];
  lowerControlPoints: ControlPoint[];
  onUpdateControlPoint: (surface: 'upper' | 'lower', id: number, value: number) => void;
  showControlPoints?: boolean;
  showLabels?: boolean;
  fillAirfoil?: boolean;
}

export function AirfoilVisualizer({
  upperControlPoints,
  lowerControlPoints,
  onUpdateControlPoint,
  showControlPoints = true,
  showLabels = true,
  fillAirfoil = true,
}: AirfoilVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<{ surface: 'upper' | 'lower'; id: number } | null>(null);
  const [hovering, setHovering] = useState<{ surface: 'upper' | 'lower'; id: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 500 });

  // Generate airfoil coordinates using CST parameterization
  const generateAirfoilPoints = (controlPoints: ControlPoint[], isUpper: boolean) => {
    const points: { x: number; y: number }[] = [];
    const numPoints = 100;

    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      
      // CST shape function (simplified)
      const classFunction = Math.sqrt(x) * Math.pow(1 - x, 1);
      
      // Bernstein polynomial basis
      let y = 0;
      const n = controlPoints.length - 1;
      
      controlPoints.forEach((cp, idx) => {
        const bernstein = 
          factorial(n) / (factorial(idx) * factorial(n - idx)) *
          Math.pow(x, idx) *
          Math.pow(1 - x, n - idx);
        y += cp.value * bernstein;
      });
      
      y *= classFunction;
      points.push({ x, y });
    }
    
    return points;
  };

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };

  // Convert coordinate space to canvas space
  const toCanvasX = (x: number, width: number) => {
    const margin = 60;
    return margin + x * (width - 2 * margin);
  };

  const toCanvasY = (y: number, height: number) => {
    const margin = 40;
    const plotHeight = height - 2 * margin;
    const yRange = 0.6; // -0.3 to 0.3
    return height / 2 - (y / yRange) * plotHeight;
  };

  const fromCanvasY = (canvasY: number, height: number) => {
    const margin = 40;
    const plotHeight = height - 2 * margin;
    const yRange = 0.6;
    return -(canvasY - height / 2) * yRange / plotHeight;
  };

  // Draw the visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = toCanvasX(i / 10, width);
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, height - 40);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = -6; i <= 6; i++) {
      const y = toCanvasY(i * 0.05, height);
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(60, height / 2);
    ctx.lineTo(width - 60, height / 2);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(60, 40);
    ctx.lineTo(60, height - 40);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#374151';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    
    // X-axis labels
    for (let i = 0; i <= 10; i += 2) {
      const x = toCanvasX(i / 10, width);
      ctx.fillText((i / 10).toFixed(1), x, height - 20);
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = -6; i <= 6; i += 2) {
      const y = toCanvasY(i * 0.05, height);
      ctx.fillText((i * 0.05).toFixed(2), 50, y + 5);
    }

    // Axis titles
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x/c', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y/c', 0, 0);
    ctx.restore();

    // Title
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('CST Airfoil Profile with Control Points', width / 2, 25);

    // Generate airfoil curves
    const upperPoints = generateAirfoilPoints(upperControlPoints, true);
    const lowerPoints = generateAirfoilPoints(lowerControlPoints, false);

    // Fill airfoil if enabled
    if (fillAirfoil) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.beginPath();
      
      // Upper surface
      upperPoints.forEach((point, i) => {
        const x = toCanvasX(point.x, width);
        const y = toCanvasY(point.y, height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      // Lower surface (reversed)
      for (let i = lowerPoints.length - 1; i >= 0; i--) {
        const point = lowerPoints[i];
        const x = toCanvasX(point.x, width);
        const y = toCanvasY(point.y, height);
        ctx.lineTo(x, y);
      }
      
      ctx.closePath();
      ctx.fill();
    }

    // Draw airfoil curves
    // Upper surface
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    upperPoints.forEach((point, i) => {
      const x = toCanvasX(point.x, width);
      const y = toCanvasY(point.y, height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Lower surface
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    lowerPoints.forEach((point, i) => {
      const x = toCanvasX(point.x, width);
      const y = toCanvasY(point.y, height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw control points if enabled
    if (showControlPoints) {
      // Upper control points (blue circles)
      upperControlPoints.forEach((cp, index) => {
        const x = toCanvasX(index / (upperControlPoints.length - 1), width);
        const y = toCanvasY(cp.value, height);
        
        const isHovering = hovering?.surface === 'upper' && hovering?.id === cp.id;
        const isDragging = dragging?.surface === 'upper' && dragging?.id === cp.id;
        
        ctx.fillStyle = isDragging || isHovering ? '#1d4ed8' : '#3b82f6';
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(x, y, isDragging || isHovering ? 8 : 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Labels
        if (showLabels) {
          ctx.fillStyle = '#1e40af';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`wu_${index}`, x, y - 12);
        }
      });

      // Lower control points (green squares)
      lowerControlPoints.forEach((cp, index) => {
        const x = toCanvasX(index / (lowerControlPoints.length - 1), width);
        const y = toCanvasY(cp.value, height);
        
        const isHovering = hovering?.surface === 'lower' && hovering?.id === cp.id;
        const isDragging = dragging?.surface === 'lower' && dragging?.id === cp.id;
        
        ctx.fillStyle = isDragging || isHovering ? '#15803d' : '#22c55e';
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 2;
        
        const size = isDragging || isHovering ? 14 : 10;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);

        // Labels
        if (showLabels) {
          ctx.fillStyle = '#166534';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`wl_${index}`, x, y + 20);
        }
      });
    }

    // Draw legend
    const legendX = width - 180;
    const legendY = 60;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.fillRect(legendX, legendY, 160, 70);
    ctx.strokeRect(legendX, legendY, 160, 70);

    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    
    // Airfoil line
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(legendX + 10, legendY + 15);
    ctx.lineTo(legendX + 35, legendY + 15);
    ctx.stroke();
    ctx.fillStyle = '#374151';
    ctx.fillText('Airfoil', legendX + 40, legendY + 19);

    // Upper control points
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(legendX + 22, legendY + 35, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#374151';
    ctx.fillText('Upper Control Points', legendX + 40, legendY + 39);

    // Lower control points
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#166534';
    ctx.fillRect(legendX + 17, legendY + 50, 10, 10);
    ctx.strokeRect(legendX + 17, legendY + 50, 10, 10);
    ctx.fillStyle = '#374151';
    ctx.fillText('Lower Control Points', legendX + 40, legendY + 59);

  }, [upperControlPoints, lowerControlPoints, showControlPoints, showLabels, fillAirfoil, hovering, dragging, canvasSize]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showControlPoints) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const width = canvas.width;
    const height = canvas.height;

    // Check upper control points
    for (let i = 0; i < upperControlPoints.length; i++) {
      const cp = upperControlPoints[i];
      const x = toCanvasX(i / (upperControlPoints.length - 1), width);
      const y = toCanvasY(cp.value, height);
      
      const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
      if (distance < 12) {
        setDragging({ surface: 'upper', id: cp.id });
        return;
      }
    }

    // Check lower control points
    for (let i = 0; i < lowerControlPoints.length; i++) {
      const cp = lowerControlPoints[i];
      const x = toCanvasX(i / (lowerControlPoints.length - 1), width);
      const y = toCanvasY(cp.value, height);
      
      const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
      if (distance < 12) {
        setDragging({ surface: 'lower', id: cp.id });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const width = canvas.width;
    const height = canvas.height;

    if (dragging) {
      const newValue = Math.max(-0.5, Math.min(0.5, fromCanvasY(mouseY, height)));
      onUpdateControlPoint(dragging.surface, dragging.id, newValue);
    } else if (showControlPoints) {
      // Update hover state
      let found = false;

      // Check upper control points
      for (let i = 0; i < upperControlPoints.length; i++) {
        const cp = upperControlPoints[i];
        const x = toCanvasX(i / (upperControlPoints.length - 1), width);
        const y = toCanvasY(cp.value, height);
        
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
        if (distance < 12) {
          setHovering({ surface: 'upper', id: cp.id });
          found = true;
          break;
        }
      }

      if (!found) {
        // Check lower control points
        for (let i = 0; i < lowerControlPoints.length; i++) {
          const cp = lowerControlPoints[i];
          const x = toCanvasX(i / (lowerControlPoints.length - 1), width);
          const y = toCanvasY(cp.value, height);
          
          const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
          if (distance < 12) {
            setHovering({ surface: 'lower', id: cp.id });
            found = true;
            break;
          }
        }
      }

      if (!found) {
        setHovering(null);
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseLeave = () => {
    setDragging(null);
    setHovering(null);
  };

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        width={1000}
        height={500}
        className="w-full border border-gray-300 rounded-lg cursor-crosshair bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}
