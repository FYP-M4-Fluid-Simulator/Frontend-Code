"use client";

import { useEffect, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface ProfessionalTurbineProps {
  liftToDragRatio: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function ProfessionalTurbine({
  liftToDragRatio,
  isFullscreen,
  onToggleFullscreen,
}: ProfessionalTurbineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to prevent clipping
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const width = canvas.width;
    const height = canvas.height;
    const rotationSpeed = (liftToDragRatio / 50) * 0.02;

    const drawScene = () => {
      // Professional dark background like CFD software
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "#0a0e1a");
      bgGradient.addColorStop(1, "#151b2e");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = "rgba(100, 150, 200, 0.1)";
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Turbine specifications
      const centerX = width / 2;
      const centerY = height * 0.65; // Moved down from 0.5
      const hubRadius = Math.min(width, height) * 0.03; // Reduced from 0.04
      const bladeLength = Math.min(width, height) * 0.30; // Reduced from 0.4 to prevent clipping

      // Draw velocity field streamlines (professional CFD style)
      const time = Date.now() / 1000;
      ctx.strokeStyle = "rgba(100, 150, 255, 0.15)";
      ctx.lineWidth = 1;

      for (let i = 0; i < 12; i++) {
        const yOffset = -200 + i * 40;
        ctx.beginPath();

        for (let x = 0; x < width; x += 5) {
          const distFromTurbine = Math.abs(x - centerX);
          const distFactor = Math.max(0, 1 - distFromTurbine / 300);
          const wave = Math.sin(x * 0.02 + time + i * 0.5) * 5 * distFactor;
          const y = centerY + yOffset + wave;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Draw pressure field visualization
      ctx.save();
      ctx.globalAlpha = 0.3;

      // Low pressure zone (blue) behind turbine
      const lowPressureGradient = ctx.createRadialGradient(
        centerX + 100,
        centerY,
        0,
        centerX + 100,
        centerY,
        200,
      );
      lowPressureGradient.addColorStop(0, "rgba(0, 150, 255, 0.4)");
      lowPressureGradient.addColorStop(1, "rgba(0, 150, 255, 0)");
      ctx.fillStyle = lowPressureGradient;
      ctx.fillRect(centerX, centerY - 200, 300, 400);

      // High pressure zone (red) in front of turbine
      const highPressureGradient = ctx.createRadialGradient(
        centerX - 100,
        centerY,
        0,
        centerX - 100,
        centerY,
        150,
      );
      highPressureGradient.addColorStop(0, "rgba(255, 100, 100, 0.4)");
      highPressureGradient.addColorStop(1, "rgba(255, 100, 100, 0)");
      ctx.fillStyle = highPressureGradient;
      ctx.fillRect(centerX - 250, centerY - 150, 250, 300);

      ctx.restore();

      // Draw tower with technical appearance
      ctx.strokeStyle = "#4a5568";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#2d3748";

      // Tower structure
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY + 50);
      ctx.lineTo(centerX - 8, centerY - 280);
      ctx.lineTo(centerX + 8, centerY - 280);
      ctx.lineTo(centerX + 12, centerY + 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tower panels
      for (let i = 0; i < 5; i++) {
        const y = centerY + 50 - (i * 280) / 5;
        ctx.strokeStyle = "#4a5568";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 12 + i * 0.8, y);
        ctx.lineTo(centerX + 12 - i * 0.8, y);
        ctx.stroke();
      }

      // Hub center position
      const hubX = centerX;
      const hubY = centerY - 280;

      // Draw nacelle (technical design)
      ctx.fillStyle = "#374151";
      ctx.strokeStyle = "#6b7280";
      ctx.lineWidth = 2;

      // Main nacelle body
      ctx.beginPath();
      ctx.roundRect(hubX - 35, hubY - 15, 70, 30, 5);
      ctx.fill();
      ctx.stroke();

      // Nacelle details
      ctx.fillStyle = "#4b5563";
      ctx.fillRect(hubX - 30, hubY - 10, 60, 5);
      ctx.fillRect(hubX - 30, hubY + 5, 60, 5);

      // Rotor blades with technical appearance
      ctx.save();
      ctx.translate(hubX, hubY);
      ctx.rotate(rotationRef.current);

      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3);

        // Blade gradient for 3D effect
        const bladeGradient = ctx.createLinearGradient(0, -8, 0, 8);
        bladeGradient.addColorStop(0, "#9ca3af");
        bladeGradient.addColorStop(0.5, "#e5e7eb");
        bladeGradient.addColorStop(1, "#6b7280");

        ctx.fillStyle = bladeGradient;
        ctx.strokeStyle = "#4b5563";
        ctx.lineWidth = 2;

        // Aerodynamic blade shape
        ctx.beginPath();
        ctx.moveTo(0, 0);

        // Smooth airfoil-like blade
        const segments = 50;
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const x = t * bladeLength;
          const thickness = 8 * Math.sin(t * Math.PI) * (1 - t * 0.7);
          const y = -thickness;

          if (s === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        for (let s = segments; s >= 0; s--) {
          const t = s / segments;
          const x = t * bladeLength;
          const thickness = 8 * Math.sin(t * Math.PI) * (1 - t * 0.7);
          const y = thickness;
          ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Blade highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, -2);
        ctx.lineTo(bladeLength * 0.8, -1);
        ctx.stroke();

        // Blade sections
        for (let section = 0.2; section < 1; section += 0.2) {
          ctx.strokeStyle = "rgba(75, 85, 99, 0.5)";
          ctx.lineWidth = 1;
          const sx = section * bladeLength;
          const thickness =
            6 * Math.sin(section * Math.PI) * (1 - section * 0.7);
          ctx.beginPath();
          ctx.moveTo(sx, -thickness);
          ctx.lineTo(sx, thickness);
          ctx.stroke();
        }

        ctx.restore();
      }

      ctx.restore();

      // Hub center (technical design)
      const hubGradient = ctx.createRadialGradient(
        hubX,
        hubY,
        0,
        hubX,
        hubY,
        hubRadius,
      );
      hubGradient.addColorStop(0, "#6b7280");
      hubGradient.addColorStop(0.6, "#4b5563");
      hubGradient.addColorStop(1, "#374151");
      ctx.fillStyle = hubGradient;

      ctx.beginPath();
      ctx.arc(hubX, hubY, hubRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hub bolts
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const bx = hubX + Math.cos(angle) * (hubRadius - 5);
        const by = hubY + Math.sin(angle) * (hubRadius - 5);

        ctx.fillStyle = "#374151";
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Velocity vectors
      const vectorSpacing = 80;
      for (let y = 100; y < height - 100; y += vectorSpacing) {
        for (let x = 50; x < width - 50; x += vectorSpacing) {
          const distFromTurbine = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - hubY, 2),
          );

          if (distFromTurbine > 100) {
            let vx = 15;
            let vy = 0;

            // Flow deflection
            if (x > centerX && distFromTurbine < 300) {
              const deflection = Math.exp(-distFromTurbine / 150);
              vy = (y - hubY) * 0.05 * deflection;
              vx *= 1 - deflection * 0.5;
            }

            const velocity = Math.sqrt(vx * vx + vy * vy);
            const normalizedVel = velocity / 15;

            // Color by velocity magnitude
            const r = Math.floor(255 * normalizedVel);
            const g = Math.floor(150 * (1 - normalizedVel * 0.5));
            const b = Math.floor(50 + 200 * (1 - normalizedVel));

            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + vx, y + vy);
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(vy, vx);
            ctx.beginPath();
            ctx.moveTo(x + vx, y + vy);
            ctx.lineTo(
              x + vx - 5 * Math.cos(angle - 0.3),
              y + vy - 5 * Math.sin(angle - 0.3),
            );
            ctx.lineTo(
              x + vx - 5 * Math.cos(angle + 0.3),
              y + vy - 5 * Math.sin(angle + 0.3),
            );
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // Technical annotations
      ctx.fillStyle = "rgba(200, 220, 255, 0.9)";
      ctx.font = "11px monospace";

      // Blade length annotation
      ctx.strokeStyle = "rgba(100, 150, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hubX, hubY);
      ctx.lineTo(
        hubX + bladeLength * Math.cos(rotationRef.current),
        hubY + bladeLength * Math.sin(rotationRef.current),
      );
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillText(`R = ${bladeLength.toFixed(0)}px`, hubX + 20, hubY - 20);

      // Tower height annotation
      ctx.beginPath();
      ctx.moveTo(centerX + 30, hubY);
      ctx.lineTo(centerX + 30, centerY + 50);
      ctx.stroke();
      ctx.fillText(`H = ${280}px`, centerX + 35, hubY + 280 / 2);

      // Performance data overlay with enhanced metrics
      ctx.fillStyle = "rgba(20, 30, 50, 0.92)";
      ctx.fillRect(20, 20, 280, 160);
      ctx.strokeStyle = "rgba(100, 150, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 280, 160);

      // Header with glow effect
      ctx.shadowColor = "rgba(100, 150, 255, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(100, 150, 255, 0.95)";
      ctx.font = "bold 14px monospace";
      ctx.fillText("TURBINE PERFORMANCE METRICS", 30, 45);

      // Reset shadow
      ctx.shadowBlur = 0;

      // Calculate enhanced metrics based on L/D ratio
      const rpm = liftToDragRatio * 0.25; // More realistic RPM calculation
      const powerKw = liftToDragRatio * 3.2; // Enhanced power calculation
      const efficiency = Math.min(98.5, (liftToDragRatio / 80) * 95); // Realistic efficiency curve
      const tipSpeed = (rpm * 2 * Math.PI * bladeLength) / (60 * 10); // Actual tip speed calculation
      const windSpeed = 12 + (liftToDragRatio - 30) * 0.15; // Estimated wind speed
      const capacity = Math.min(100, (powerKw / 25) * 100); // Capacity factor

      // Metrics with professional styling
      ctx.font = "12px monospace";

      // Primary metrics (green for good performance)
      ctx.fillStyle = "rgba(100, 255, 150, 0.95)";
      ctx.fillText(`RPM:          ${rpm.toFixed(1)}`, 35, 70);
      ctx.fillText(`Power:        ${powerKw.toFixed(0)} kW`, 35, 85);
      ctx.fillText(`L/D Ratio:    ${liftToDragRatio.toFixed(1)}`, 35, 100);

      // Secondary metrics (cyan for operational data)
      ctx.fillStyle = "rgba(100, 200, 255, 0.95)";
      ctx.fillText(`Efficiency:   ${efficiency.toFixed(1)}%`, 35, 120);
      ctx.fillText(`Tip Speed:    ${tipSpeed.toFixed(1)} m/s`, 35, 135);
      ctx.fillText(`Wind Speed:   ${windSpeed.toFixed(1)} m/s`, 35, 150);

      // Capacity factor (orange/red based on performance)
      const capacityColor =
        capacity > 80
          ? "rgba(100, 255, 100, 0.95)"
          : capacity > 60
            ? "rgba(255, 200, 100, 0.95)"
            : "rgba(255, 150, 100, 0.95)";
      ctx.fillStyle = capacityColor;
      ctx.fillText(`Capacity:     ${capacity.toFixed(1)}%`, 35, 165);

      // Performance indicator bars
      const barStartX = 200;
      const barWidth = 80;
      const barHeight = 8;

      // Efficiency bar
      ctx.fillStyle = "rgba(50, 60, 80, 0.8)";
      ctx.fillRect(barStartX, 112, barWidth, barHeight);
      ctx.fillStyle = "rgba(100, 255, 150, 0.8)";
      ctx.fillRect(barStartX, 112, (efficiency / 100) * barWidth, barHeight);

      // Capacity bar
      ctx.fillStyle = "rgba(50, 60, 80, 0.8)";
      ctx.fillRect(barStartX, 157, barWidth, barHeight);
      ctx.fillStyle = capacityColor;
      ctx.fillRect(barStartX, 157, (capacity / 100) * barWidth, barHeight);

      // Status indicators
      const statusY = 30;
      const statusSize = 8;

      // Operational status (green dot)
      ctx.fillStyle = "rgba(100, 255, 100, 0.9)";
      ctx.beginPath();
      ctx.arc(260, statusY, statusSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(200, 220, 255, 0.9)";
      ctx.font = "10px monospace";
      ctx.fillText("OPERATIONAL", 210, statusY + 3);

      rotationRef.current += rotationSpeed;
      animationRef.current = requestAnimationFrame(drawScene);
    };

    drawScene();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [liftToDragRatio]);

  return (
    <div
      className={`flex-1 flex items-center justify-center bg-[#0a0e1a] relative ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
    >
      <canvas
        ref={canvasRef}
        width={1400}
        height={800}
        className="max-w-full max-h-full"
      />
      <button
        onClick={onToggleFullscreen}
        className="absolute top-4 right-4 p-2 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg shadow-lg transition-colors border border-gray-600"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5" />
        ) : (
          <Maximize2 className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
