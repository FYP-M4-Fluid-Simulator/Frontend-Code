import { useEffect, useRef, useState } from 'react';

interface OptimizationAnimationProps {
  onComplete: () => void;
}

export function OptimizationAnimation({ onComplete }: OptimizationAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showInitialLoader, setShowInitialLoader] = useState(true);
  const [iteration, setIteration] = useState(0);
  const [currentFitness, setCurrentFitness] = useState(45.2);
  const animationRef = useRef<number>();
  const progressRef = useRef(0);

  // Hide initial loader after 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoader(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Progress iteration counter
  useEffect(() => {
    if (!showInitialLoader) {
      const interval = setInterval(() => {
        setIteration(prev => {
          const next = prev + 1;
          if (next >= 50) {
            clearInterval(interval);
            setTimeout(onComplete, 500);
            return 50;
          }
          return next;
        });
        setCurrentFitness(prev => prev + (87.3 - 45.2) / 50 + Math.random() * 2 - 1);
      }, 180);
      return () => clearInterval(interval);
    }
  }, [showInitialLoader, onComplete]);

  useEffect(() => {
    if (showInitialLoader) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Helper function to generate morphing airfoil
    const generateMorphingAirfoil = (x: number, progress: number) => {
      // Start with NACA 4412, morph to optimized shape
      const t_start = 0.12;
      const t_end = 0.142;
      const t = t_start + (t_end - t_start) * progress;
      
      const yt = 5 * t * (
        0.2969 * Math.sqrt(x) -
        0.1260 * x -
        0.3516 * x * x +
        0.2843 * x * x * x -
        0.1015 * x * x * x * x
      );

      const m_start = 0.04;
      const m_end = 0.058;
      const m = m_start + (m_end - m_start) * progress;
      
      const p_start = 0.4;
      const p_end = 0.38;
      const p = p_start + (p_end - p_start) * progress;
      
      let yc = 0;
      
      if (x < p) {
        yc = (m / (p * p)) * (2 * p * x - x * x);
      } else {
        yc = (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * x - x * x);
      }

      return { yc, yt };
    };

    // CFD color function
    const getCFDColor = (cp: number) => {
      const normalized = (cp + 3) / 4;
      const clamped = Math.max(0, Math.min(1, normalized));
      
      let r, g, b;
      
      if (clamped < 0.25) {
        const t = clamped / 0.25;
        r = Math.floor(0 * (1 - t) + 0 * t);
        g = Math.floor(0 * (1 - t) + 180 * t);
        b = Math.floor(139 * (1 - t) + 255 * t);
      } else if (clamped < 0.5) {
        const t = (clamped - 0.25) / 0.25;
        r = Math.floor(0 * (1 - t) + 0 * t);
        g = Math.floor(180 * (1 - t) + 255 * t);
        b = Math.floor(255 * (1 - t) + 0 * t);
      } else if (clamped < 0.75) {
        const t = (clamped - 0.5) / 0.25;
        r = Math.floor(0 * (1 - t) + 255 * t);
        g = Math.floor(255 * (1 - t) + 255 * t);
        b = Math.floor(0 * (1 - t) + 0 * t);
      } else {
        const t = (clamped - 0.75) / 0.25;
        r = 255;
        g = Math.floor(255 * (1 - t) + 0 * t);
        b = 0;
      }
      
      return { r, g, b };
    };

    const animate = () => {
      progressRef.current += 0.002;
      if (progressRef.current > 1) progressRef.current = 1;

      const centerX = width / 2;
      const centerY = height / 2;
      const chordLength = 400;
      const scale = chordLength;
      const progress = progressRef.current;
      const animTime = Date.now() / 1000;

      // Clear canvas
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);

      // Draw animated pressure field
      const imageData = ctx.createImageData(width, height);
      
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const px = (x - centerX) / scale;
          const py = (centerY - y) / scale;
          
          let cp = 0;
          const chordPos = px;
          
          if (chordPos >= -0.2 && chordPos <= 1.2) {
            if (chordPos >= 0 && chordPos <= 1) {
              const { yc, yt } = generateMorphingAirfoil(chordPos, progress);
              const upperY = yc + yt;
              const lowerY = yc - yt;
              
              if (py < upperY + 0.05 && py > upperY - 0.05) {
                const distFactor = Math.exp(-Math.abs(py - upperY) * 20);
                
                if (py > upperY && chordPos > 0.1 && chordPos < 0.5) {
                  cp = -2.5 * distFactor * (1 - Math.abs(chordPos - 0.3) * 2);
                  cp += Math.sin(animTime * 3 + x * 0.05) * 0.3 * distFactor;
                } else if (py > upperY) {
                  cp = -1.2 * distFactor;
                }
              } else if (py < lowerY + 0.05 && py > lowerY - 0.05) {
                const distFactor = Math.exp(-Math.abs(py - lowerY) * 20);
                
                if (py < lowerY && chordPos < 0.3) {
                  cp = 0.8 * distFactor * (1 - chordPos * 1.5);
                  cp += Math.sin(animTime * 2.5 + x * 0.05) * 0.2 * distFactor;
                }
              }
              
              if (chordPos < 0.05) {
                const leDistFactor = Math.exp(-Math.sqrt(px * px + py * py) * 10);
                cp = Math.max(cp, 1.0 * leDistFactor);
              }
            }
          }
          
          const flowVariation = Math.sin(px * 3 + animTime * 2) * Math.cos(py * 4) * 0.1;
          cp += flowVariation * Math.exp(-Math.abs(py) * 2);
          
          const color = getCFDColor(cp);
          
          // Fill 2x2 block for performance
          for (let dy = 0; dy < 2 && y + dy < height; dy++) {
            for (let dx = 0; dx < 2 && x + dx < width; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              imageData.data[idx] = color.r;
              imageData.data[idx + 1] = color.g;
              imageData.data[idx + 2] = color.b;
              imageData.data[idx + 3] = 255;
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);

      // Draw animated streamlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;

      const streamlines = [-0.35, -0.25, -0.15, -0.05, 0.05, 0.15, 0.25, 0.35];
      
      streamlines.forEach(startY => {
        ctx.beginPath();
        
        for (let x = -0.5; x < 2; x += 0.01) {
          let y = startY;
          
          if (x >= 0 && x <= 1) {
            const { yc, yt } = generateMorphingAirfoil(x, progress);
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
          
          // Add flow animation
          y += Math.sin(x * 10 + animTime * 5) * 0.01;
          
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

      // Draw morphing airfoil
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#1f2937';
      ctx.lineWidth = 3;

      const points: { x: number; y: number }[] = [];
      const numPoints = 100;

      for (let i = 0; i <= numPoints; i++) {
        const x = i / numPoints;
        const { yc, yt } = generateMorphingAirfoil(x, progress);
        const xu = centerX + x * scale;
        const yu = centerY - (yc + yt) * scale;
        points.push({ x: xu, y: yu });
      }

      for (let i = numPoints; i >= 0; i--) {
        const x = i / numPoints;
        const { yc, yt } = generateMorphingAirfoil(x, progress);
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

      // Draw velocity vectors with animation
      ctx.lineWidth = 1.5;

      for (let y = 50; y < height; y += 60) {
        for (let x = 50; x < width; x += 60) {
          const px = (x - centerX) / scale;
          const py = (centerY - y) / scale;
          
          if (px >= 0 && px <= 1) {
            const { yc, yt } = generateMorphingAirfoil(px, progress);
            if (py < yc + yt && py > yc - yt) continue;
          }

          let vx = 20;
          let vy = 0;
          let velocity = 1.0;
          
          if (px >= -0.2 && px <= 1.2) {
            const { yc, yt } = generateMorphingAirfoil(Math.max(0, Math.min(1, px)), progress);
            const dist = Math.abs(py - yc);
            
            if (dist < 0.3) {
              vy = (py - yc) * 30 * Math.exp(-Math.pow(px - 0.3, 2) * 2);
              velocity = 1 + Math.exp(-dist * 5) * 0.5;
              vx *= velocity;
              
              // Add animation pulse
              const pulse = Math.sin(animTime * 4 + x * 0.1) * 0.1 + 1;
              vx *= pulse;
              vy *= pulse;
            }
          }

          const velColor = getCFDColor((velocity - 1) * 2);
          ctx.strokeStyle = `rgba(${velColor.r}, ${velColor.g}, ${velColor.b}, 0.7)`;

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + vx, y + vy);
          ctx.stroke();
          
          const angle = Math.atan2(vy, vx);
          ctx.beginPath();
          ctx.moveTo(x + vx, y + vy);
          ctx.lineTo(x + vx - 6 * Math.cos(angle - 0.4), y + vy - 6 * Math.sin(angle - 0.4));
          ctx.moveTo(x + vx, y + vy);
          ctx.lineTo(x + vx - 6 * Math.cos(angle + 0.4), y + vy - 6 * Math.sin(angle + 0.4));
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showInitialLoader]);

  if (showInitialLoader) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 border-8 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Initializing Optimization...</h2>
          <p className="text-gray-600">Setting up genetic algorithm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Progress Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold">Optimizing Airfoil Shape</h2>
            <span className="text-gray-300 text-sm">Iteration {iteration} / 50</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(iteration / 50) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Current L/D Ratio: {currentFitness.toFixed(1)}</span>
            <span>Best: {Math.max(currentFitness, 45.2).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Animated Flow Field */}
      <div className="flex-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="max-w-full max-h-full"
        />
      </div>

      {/* Status Messages */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Evaluating fitness scores</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Computing flow dynamics</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Evolving population</span>
          </div>
        </div>
      </div>
    </div>
  );
}
