import { useEffect, useRef } from 'react';

export function AirfoilCanvas() {
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

    // Draw grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 0);
    ctx.lineTo(width / 2 - 200, height);
    ctx.stroke();

    // Generate NACA 4412 airfoil coordinates
    const chordLength = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = chordLength;

    const generateNACA4412 = (x: number) => {
      // Thickness distribution (12% thick)
      const t = 0.12;
      const yt = 5 * t * (
        0.2969 * Math.sqrt(x) -
        0.1260 * x -
        0.3516 * x * x +
        0.2843 * x * x * x -
        0.1015 * x * x * x * x
      );

      // Camber line (4% camber at 40% chord)
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

    // Draw airfoil
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#1e40af';
    ctx.lineWidth = 2;

    const points: { x: number; y: number }[] = [];
    const numPoints = 100;

    // Upper surface
    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      const { yc, yt } = generateNACA4412(x);
      const xu = centerX + x * scale;
      const yu = centerY - (yc + yt) * scale;
      points.push({ x: xu, y: yu });
    }

    // Lower surface
    for (let i = numPoints; i >= 0; i--) {
      const x = i / numPoints;
      const { yc, yt } = generateNACA4412(x);
      const xl = centerX + x * scale;
      const yl = centerY - (yc - yt) * scale;
      points.push({ x: xl, y: yl });
    }

    // Draw filled airfoil
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw control points
    ctx.fillStyle = '#fbbf24';
    const controlPointsX = [0, 0.25, 0.5, 0.75, 1.0];
    controlPointsX.forEach(x => {
      const { yc } = generateNACA4412(x);
      const cx = centerX + x * scale;
      const cy = centerY - yc * scale;
      
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw dimensions
    ctx.strokeStyle = '#9ca3af';
    ctx.fillStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.font = '12px monospace';

    // Chord line
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + chordLength, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Chord label
    ctx.fillText('Chord = 1.0 m', centerX + chordLength / 2 - 40, centerY + 20);

    // Thickness indicator
    const maxThickX = centerX + 0.3 * scale;
    const { yc: ycMax, yt: ytMax } = generateNACA4412(0.3);
    const topY = centerY - (ycMax + ytMax) * scale;
    const bottomY = centerY - (ycMax - ytMax) * scale;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(maxThickX, topY);
    ctx.lineTo(maxThickX, bottomY);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.fillText('t = 12%', maxThickX + 10, (topY + bottomY) / 2);

  }, []);

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
