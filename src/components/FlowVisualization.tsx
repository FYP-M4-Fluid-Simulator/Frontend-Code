'use client';

import { useEffect, useRef } from 'react';

interface FlowVisualizationProps {
  isSimulating: boolean;
}

export function FlowVisualization({ isSimulating }: FlowVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const chordLength = 400;
    const scale = chordLength;

    // Generate airfoil shape (NACA 4412)
    const generateNACA4412 = (x: number) => {
      const t = 0.12;
      const yt = 5 * t * (
        0.2969 * Math.sqrt(x) -
        0.1260 * x -
        0.3516 * x * x +
        0.2843 * x * x * x -
        0.1015 * x * x * x * x
      );

      const m = 0.04;
      const p = 0.4;
      let yc = 0;
      
      if (x < p) {
        yc = (m / (p * p)) * (2 * p * x - x * x);
      } else {
        yc = (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * x - x * x);
      }

      return { yc, yt };
    };

    // Helper function to get CFD-style color based on pressure coefficient
    const getCFDColor = (cp: number) => {
      // Normalize cp to 0-1 range (typical Cp range is -3 to 1)
      const normalized = (cp + 3) / 4;
      const clamped = Math.max(0, Math.min(1, normalized));
      
      let r, g, b;
      
      if (clamped < 0.25) {
        // Dark blue to cyan (low pressure)
        const t = clamped / 0.25;
        r = Math.floor(0 * (1 - t) + 0 * t);
        g = Math.floor(0 * (1 - t) + 180 * t);
        b = Math.floor(139 * (1 - t) + 255 * t);
      } else if (clamped < 0.5) {
        // Cyan to green
        const t = (clamped - 0.25) / 0.25;
        r = Math.floor(0 * (1 - t) + 0 * t);
        g = Math.floor(180 * (1 - t) + 255 * t);
        b = Math.floor(255 * (1 - t) + 0 * t);
      } else if (clamped < 0.75) {
        // Green to yellow
        const t = (clamped - 0.5) / 0.25;
        r = Math.floor(0 * (1 - t) + 255 * t);
        g = Math.floor(255 * (1 - t) + 255 * t);
        b = Math.floor(0 * (1 - t) + 0 * t);
      } else {
        // Yellow to red (high pressure)
        const t = (clamped - 0.75) / 0.25;
        r = 255;
        g = Math.floor(255 * (1 - t) + 0 * t);
        b = 0;
      }
      
      return { r, g, b };
    };

    // Draw pressure field with CFD colors
    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = (x - centerX) / scale;
        const py = (centerY - y) / scale;
        
        let cp = 0; // Pressure coefficient
        
        // Calculate pressure coefficient based on position relative to airfoil
        const chordPos = px;
        
        if (chordPos >= -0.2 && chordPos <= 1.2) {
          let minDist = Infinity;
          let isInside = false;
          
          // Check if inside or outside airfoil
          if (chordPos >= 0 && chordPos <= 1) {
            const { yc, yt } = generateNACA4412(chordPos);
            const upperY = yc + yt;
            const lowerY = yc - yt;
            
            if (py >= lowerY && py <= upperY) {
              isInside = true;
            }
            
            const distToUpper = Math.abs(py - upperY);
            const distToLower = Math.abs(py - lowerY);
            minDist = Math.min(distToUpper, distToLower);
            
            // Calculate pressure coefficient
            if (!isInside) {
              const distFactor = Math.exp(-minDist * 8);
              
              // Upper surface - low pressure (suction)
              if (py > upperY && chordPos > 0.1 && chordPos < 0.5) {
                cp = -2.5 * distFactor * (1 - Math.abs(chordPos - 0.3) * 2);
              } else if (py > upperY) {
                cp = -1.2 * distFactor * (1 - Math.abs(chordPos - 0.3) * 1.5);
              }
              
              // Lower surface - higher pressure
              if (py < lowerY && chordPos < 0.3) {
                cp = 0.8 * distFactor * (1 - chordPos * 1.5);
              } else if (py < lowerY) {
                cp = 0.3 * distFactor;
              }
              
              // Leading edge stagnation point (high pressure)
              if (chordPos < 0.05) {
                const leDistFactor = Math.exp(-Math.sqrt(px * px + py * py) * 10);
                cp = Math.max(cp, 1.0 * leDistFactor);
              }
            }
          } else {
            // Outside chord region
            const distFromLE = Math.sqrt((px) * (px) + py * py);
            const distFromTE = Math.sqrt((px - 1) * (px - 1) + py * py);
            const minDistToEnds = Math.min(distFromLE, distFromTE);
            
            if (minDistToEnds < 0.3) {
              const distFactor = Math.exp(-minDistToEnds * 5);
              cp = -0.5 * distFactor;
            }
          }
        } else {
          // Far field
          cp = 0;
        }
        
        // Add some ambient flow variation
        const flowVariation = Math.sin(px * 3) * Math.cos(py * 4) * 0.1;
        cp += flowVariation * Math.exp(-Math.abs(py) * 2);
        
        // Get color based on pressure coefficient
        const color = getCFDColor(cp);
        
        const idx = (y * width + x) * 4;
        imageData.data[idx] = color.r;
        imageData.data[idx + 1] = color.g;
        imageData.data[idx + 2] = color.b;
        imageData.data[idx + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);

    // Draw contour lines for pressure levels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    const contourLevels = [-2.5, -2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0];
    
    contourLevels.forEach(level => {
      ctx.beginPath();
      let started = false;
      
      for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
        const radius = 0.2 + (level + 3) / 4 * 0.3;
        const x = 0.3 + Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.5;
        
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.stroke();
    });

    // Draw streamlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;

    const streamlines = [-0.35, -0.25, -0.15, -0.05, 0.05, 0.15, 0.25, 0.35];
    
    streamlines.forEach(startY => {
      ctx.beginPath();
      
      for (let x = -0.5; x < 2; x += 0.01) {
        let y = startY;
        
        // Simple flow deflection around airfoil
        if (x >= 0 && x <= 1) {
          const { yc, yt } = generateNACA4412(x);
          const upperY = yc + yt + 0.05;
          const lowerY = yc - yt - 0.05;
          
          if (Math.abs(y - yc) < yt + 0.15) {
            if (y > yc) {
              y = upperY + (y - yc - yt) * Math.exp(-Math.pow(x - 0.3, 2));
            } else {
              y = lowerY + (y - yc + yt) * Math.exp(-Math.pow(x - 0.3, 2));
            }
          }
        }
        
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        
        if (x === -0.5) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      
      ctx.stroke();
    });

    // Draw airfoil outline with slight glow
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#1f2937';
    ctx.lineWidth = 3;

    const points: { x: number; y: number }[] = [];
    const numPoints = 100;

    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      const { yc, yt } = generateNACA4412(x);
      const xu = centerX + x * scale;
      const yu = centerY - (yc + yt) * scale;
      points.push({ x: xu, y: yu });
    }

    for (let i = numPoints; i >= 0; i--) {
      const x = i / numPoints;
      const { yc, yt } = generateNACA4412(x);
      const xl = centerX + x * scale;
      const yl = centerY - (yc - yt) * scale;
      points.push({ x: xl, y: yl });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    // Draw velocity vectors with color coding
    ctx.lineWidth = 1.5;

    for (let y = 50; y < height; y += 60) {
      for (let x = 50; x < width; x += 60) {
        const px = (x - centerX) / scale;
        const py = (centerY - y) / scale;
        
        // Skip vectors inside airfoil
        if (px >= 0 && px <= 1) {
          const { yc, yt } = generateNACA4412(px);
          if (py < yc + yt && py > yc - yt) continue;
        }

        // Calculate vector direction and magnitude
        let vx = 20;
        let vy = 0;
        let velocity = 1.0;
        
        if (px >= -0.2 && px <= 1.2) {
          const { yc, yt } = generateNACA4412(Math.max(0, Math.min(1, px)));
          const dist = Math.abs(py - yc);
          
          if (dist < 0.3) {
            vy = (py - yc) * 30 * Math.exp(-Math.pow(px - 0.3, 2) * 2);
            velocity = 1 + Math.exp(-dist * 5) * 0.5;
            vx *= velocity;
          }
        }

        // Color code by velocity magnitude
        const velColor = getCFDColor((velocity - 1) * 2);
        ctx.strokeStyle = `rgba(${velColor.r}, ${velColor.g}, ${velColor.b}, 0.7)`;
        ctx.fillStyle = `rgba(${velColor.r}, ${velColor.g}, ${velColor.b}, 0.7)`;

        // Draw vector
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + vx, y + vy);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(vy, vx);
        ctx.beginPath();
        ctx.moveTo(x + vx, y + vy);
        ctx.lineTo(
          x + vx - 6 * Math.cos(angle - 0.4),
          y + vy - 6 * Math.sin(angle - 0.4)
        );
        ctx.moveTo(x + vx, y + vy);
        ctx.lineTo(
          x + vx - 6 * Math.cos(angle + 0.4),
          y + vy - 6 * Math.sin(angle + 0.4)
        );
        ctx.stroke();
      }
    }

    // Draw enhanced legend with CFD color scale
    const legendX = 50;
    const legendY = height - 120;
    const legendWidth = 30;
    const legendHeight = 200;

    // Draw color scale
    const scaleSteps = 100;
    for (let i = 0; i < scaleSteps; i++) {
      const cp = -3 + (i / scaleSteps) * 4;
      const color = getCFDColor(cp);
      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.fillRect(legendX, legendY + (scaleSteps - i - 1) * (legendHeight / scaleSteps), legendWidth, legendHeight / scaleSteps + 1);
    }
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
    
    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('Cp', legendX + legendWidth + 10, legendY - 10);
    
    ctx.font = '12px monospace';
    const labels = [
      { value: '-3.0', y: legendY + legendHeight },
      { value: '-2.0', y: legendY + legendHeight * 0.75 },
      { value: '-1.0', y: legendY + legendHeight * 0.5 },
      { value: '0.0', y: legendY + legendHeight * 0.25 },
      { value: '1.0', y: legendY }
    ];
    
    labels.forEach(label => {
      ctx.fillText(label.value, legendX + legendWidth + 10, label.y + 4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(legendX, label.y);
      ctx.lineTo(legendX + legendWidth + 5, label.y);
      ctx.stroke();
    });
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.fillText('Low Pressure', legendX - 5, legendY - 25);
    ctx.fillText('(Suction)', legendX + 5, legendY - 12);
    ctx.fillText('High Pressure', legendX - 10, legendY + legendHeight + 20);
    ctx.fillText('(Stagnation)', legendX, legendY + legendHeight + 33);

  }, [isSimulating]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        className="max-w-full max-h-full"
      />
    </div>
  );
}