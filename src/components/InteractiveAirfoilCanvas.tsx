"use client";

import { useRef, useState, useEffect } from "react";
import { generateAirfoil, rotateAirfoil } from "@/lib/cst";
import { calculatePotentialFlow, getPressureColor } from "@/lib/flowField";
import { Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ControlPoint {
  id: string;
  x: number;
  y: number;
  coefficient: number;
  surface: "upper" | "lower";
  index: number;
}

interface InteractiveAirfoilCanvasProps {
  width: number;
  height: number;
  upperCoefficients: number[];
  lowerCoefficients: number[];
  angleOfAttack: number;
  velocity: number;
  meshQuality: "coarse" | "medium" | "fine" | "ultra";
  showControlPoints: boolean;
  showMeshOverlay: boolean;
  showPressureField: boolean;
  showVectorField: boolean;
  onCoefficientChange: (
    surface: "upper" | "lower",
    index: number,
    value: number,
  ) => void;
  allowFullScreen: boolean;
  designMode?: boolean; // NEW: flag for design mode
  onControlPointDragStart?: () => void;
  onControlPointDragEnd?: () => void;
}

export function InteractiveAirfoilCanvas({
  width,
  height,
  upperCoefficients,
  lowerCoefficients,
  angleOfAttack,
  velocity,
  meshQuality,
  showControlPoints,
  showMeshOverlay,
  showPressureField,
  showVectorField,
  onCoefficientChange,
  allowFullScreen,
  designMode = false,
  onControlPointDragStart,
  onControlPointDragEnd,
}: InteractiveAirfoilCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<ControlPoint | null>(null);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const animationFrameRef = useRef<number>();

  // Generate airfoil and control points
  useEffect(() => {
    const { upper, lower } = generateAirfoil(
      upperCoefficients,
      lowerCoefficients,
      100,
    );
    const rotated = rotateAirfoil(upper, lower, angleOfAttack, 0.25);

    const scale = Math.min(width, height) * 0.7;
    const offsetX = width / 2;
    const offsetY = height / 2;

    const transformPoint = (p: { x: number; y: number }) => ({
      x: offsetX + (p.x - 0.5) * scale,
      y: offsetY - p.y * scale,
    });

    // Create control points from CST coefficients
    const points: ControlPoint[] = [];

    upperCoefficients.forEach((coeff, idx) => {
      const t = idx / Math.max(upperCoefficients.length - 1, 1);
      const sampleIdx = Math.floor(t * (upper.length - 1));
      const pt = transformPoint(rotated.upper[sampleIdx]);
      points.push({
        id: `upper-${idx}`,
        x: pt.x,
        y: pt.y,
        coefficient: coeff,
        surface: "upper",
        index: idx,
      });
    });

    lowerCoefficients.forEach((coeff, idx) => {
      const t = idx / Math.max(lowerCoefficients.length - 1, 1);
      const sampleIdx = Math.floor(t * (lower.length - 1));
      const pt = transformPoint(rotated.lower[sampleIdx]);
      points.push({
        id: `lower-${idx}`,
        x: pt.x,
        y: pt.y,
        coefficient: coeff,
        surface: "lower",
        index: idx,
      });
    });

    setControlPoints(points);
  }, [upperCoefficients, lowerCoefficients, angleOfAttack, width, height]);

  // Render CFD background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const { upper, lower } = generateAirfoil(
      upperCoefficients,
      lowerCoefficients,
      100,
    );
    const rotated = rotateAirfoil(upper, lower, angleOfAttack, 0.25);
    const airfoilPoints = [...rotated.upper, ...rotated.lower.reverse()];

    const scale = Math.min(width, height) * 0.7;
    const offsetX = width / 2;
    const offsetY = height / 2;

    const gridSpacing = {
      coarse: 40,
      medium: 25,
      fine: 15,
      ultra: 10,
    }[meshQuality];

    let time = 0;

    const render = () => {
      time += 0.016;

      // this means we are on the design page (first page) and not the simulator page (second page)
      if (designMode) {
        // Dark background for design mode
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, width, height);

        // Draw subtle grid lines for technical drawing feel
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 0.5;

        // Major grid lines every 4 units
        const majorGridSpacing = 80;
        for (let x = 0; x <= width; x += majorGridSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += majorGridSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Minor grid lines every unit
        const minorGridSpacing = 20;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 0.3;
        for (let x = 0; x <= width; x += minorGridSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += minorGridSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw coordinate axes
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        // Horizontal axis through center
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        // Vertical axis through center
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
      }

      // this means we are on finalize design page
      else {
        // Clear with dark blue background for simulation mode (matching the reference image)
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#0B1628");
        gradient.addColorStop(0.5, "#1a2942");
        gradient.addColorStop(1, "#0B1628");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw pressure field heatmap (ANSYS-style smooth contours) - only in simulation mode
      if (showPressureField && !designMode) {
        const cellSize = gridSpacing / 2;

        for (let x = 0; x < width; x += cellSize) {
          for (let y = 0; y < height; y += cellSize) {
            const ax = (x - offsetX) / scale + 0.5;
            const ay = (offsetY - y) / scale;

            const flow = calculatePotentialFlow(
              ax,
              ay,
              airfoilPoints,
              angleOfAttack,
              velocity,
            );

            // ANSYS-style color mapping: Red/Orange (high) → Cyan/Blue (low)
            let color;
            const Cp = flow.pressure;

            if (Cp > 0.8) {
              // Stagnation - Vibrant Red
              const t = (Cp - 0.8) / 0.2;
              color = `rgba(${Math.floor(220 + t * 35)}, ${Math.floor(30 + t * 20)}, ${Math.floor(25 + t * 15)}, 0.75)`;
            } else if (Cp > 0.4) {
              // High pressure - Red to Orange
              const t = (Cp - 0.4) / 0.4;
              color = `rgba(${Math.floor(220 + t * 25)}, ${Math.floor(80 + t * 80)}, ${Math.floor(25 + t * 20)}, 0.7)`;
            } else if (Cp > 0) {
              // Medium - Orange to Yellow
              const t = Cp / 0.4;
              color = `rgba(${Math.floor(245 + t * 10)}, ${Math.floor(160 + t * 55)}, ${Math.floor(45 + t * 50)}, 0.65)`;
            } else if (Cp > -1) {
              // Low pressure - Yellow to Cyan
              const t = (Cp + 1) / 1;
              color = `rgba(${Math.floor(100 - t * 50)}, ${Math.floor(200 + t * 15)}, ${Math.floor(220 + t * 35)}, 0.7)`;
            } else {
              // Very low - Electric Cyan/Deep Blue
              const t = Math.max(0, Math.min(1, (Cp + 3) / 2));
              color = `rgba(${Math.floor(20 + t * 30)}, ${Math.floor(150 + t * 50)}, ${Math.floor(255)}, 0.75)`;
            }

            ctx.fillStyle = color;
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }

        // Smooth contours with enhanced blur
        ctx.filter = "blur(6px)";
        ctx.globalCompositeOperation = "soft-light";
        ctx.globalAlpha = 0.3;

        const softGradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.max(width, height) / 2,
        );
        softGradient.addColorStop(0, "rgba(255, 248, 240, 0.5)");
        softGradient.addColorStop(1, "rgba(255, 232, 213, 0.3)");
        ctx.fillStyle = softGradient;
        ctx.fillRect(0, 0, width, height);

        ctx.filter = "none";
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }

      // Draw mesh overlay (sharp Eulerian grid) - only in simulation mode
      if (showMeshOverlay && !designMode) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.25)"; // Blue grid lines to match theme
        ctx.lineWidth = 0.8;

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
      }

      // Draw vector field with dynamic arrows - only in simulation mode
      if (showVectorField && !designMode) {
        const arrowSpacing = gridSpacing * 1.5;
        const arrowScale = {
          coarse: 1.2,
          medium: 1.0,
          fine: 0.8,
          ultra: 0.6,
        }[meshQuality];

        for (
          let x = arrowSpacing;
          x < width - arrowSpacing;
          x += arrowSpacing
        ) {
          for (
            let y = arrowSpacing;
            y < height - arrowSpacing;
            y += arrowSpacing
          ) {
            const ax = (x - offsetX) / scale + 0.5;
            const ay = (offsetY - y) / scale;

            const flow = calculatePotentialFlow(
              ax,
              ay,
              airfoilPoints,
              angleOfAttack,
              velocity,
            );

            if (flow.speed === 0) continue;

            const angle = Math.atan2(flow.vy, flow.vx);
            const magnitude =
              Math.min(flow.speed / velocity, 2) * 12 * arrowScale;

            const pulse =
              0.88 + Math.sin(time * 2 + x * 0.02 + y * 0.02) * 0.12;
            const arrowLength = magnitude * pulse;

            const endX = x + Math.cos(angle) * arrowLength;
            const endY = y + Math.sin(angle) * arrowLength;

            // Color: Red (stagnation) → Orange → Yellow → Cyan (fast)
            const speedRatio = Math.min(flow.speed / (velocity * 1.5), 1);
            let arrowColor;
            let arrowGlow;

            if (speedRatio > 0.75) {
              // Very fast - Electric Cyan
              arrowColor = "rgba(0, 200, 255, 0.9)";
              arrowGlow = "rgba(0, 200, 255, 0.4)";
            } else if (speedRatio > 0.5) {
              // Fast - Cyan to Yellow
              const t = (speedRatio - 0.5) / 0.25;
              const r = Math.floor(255 - t * 255);
              const g = Math.floor(220 - t * 20);
              const b = Math.floor(50 + t * 205);
              arrowColor = `rgba(${r}, ${g}, ${b}, 0.85)`;
              arrowGlow = `rgba(${r}, ${g}, ${b}, 0.3)`;
            } else if (speedRatio > 0.3) {
              // Medium - Orange/Yellow
              arrowColor = "rgba(255, 180, 50, 0.85)";
              arrowGlow = "rgba(255, 180, 50, 0.3)";
            } else {
              // Slow - Vibrant Red
              arrowColor = "rgba(240, 60, 50, 0.9)";
              arrowGlow = "rgba(240, 60, 50, 0.4)";
            }

            ctx.strokeStyle = arrowColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = arrowGlow;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            const headLength = 5 * arrowScale;
            const headAngle = Math.PI / 7;

            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLength * Math.cos(angle - headAngle),
              endY - headLength * Math.sin(angle - headAngle),
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLength * Math.cos(angle + headAngle),
              endY - headLength * Math.sin(angle + headAngle),
            );
            ctx.stroke();

            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw airfoil with Deep Blue Neon Glow
      const transformPoint = (p: { x: number; y: number }) => ({
        x: offsetX + (p.x - 0.5) * scale,
        y: offsetY - p.y * scale,
      });

      const airfoilCanvasPoints = [
        ...rotated.upper.map(transformPoint),
        ...rotated.lower.reverse().map(transformPoint),
      ];

      if (designMode) {
        // Clean technical drawing style for design mode
        ctx.shadowBlur = 0;

        // Draw airfoil outline with blue fill
        ctx.fillStyle = "rgba(30, 64, 175, 0.6)"; // #1E40AF with transparency
        ctx.strokeStyle = "rgba(30, 64, 175, 0.9)"; // #1E40AF border
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(airfoilCanvasPoints[0].x, airfoilCanvasPoints[0].y);
        for (let i = 1; i < airfoilCanvasPoints.length; i++) {
          ctx.lineTo(airfoilCanvasPoints[i].x, airfoilCanvasPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Define leading and trailing edge points for reference
        const leadingEdge = transformPoint({ x: 0, y: 0 });
        const trailingEdge = transformPoint({ x: 1, y: 0 });

        // Leading edge marker (yellow)
        ctx.fillStyle = "#fbbf24"; // Yellow
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(251, 191, 36, 0.7)";
        ctx.beginPath();
        ctx.arc(leadingEdge.x, leadingEdge.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Add "LE" label
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("LE", leadingEdge.x, leadingEdge.y - 15);

        // Trailing edge marker (yellow)
        ctx.fillStyle = "#fbbf24"; // Yellow
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(251, 191, 36, 0.7)";
        ctx.beginPath();
        ctx.arc(trailingEdge.x, trailingEdge.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Add "TE" label
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillText("TE", trailingEdge.x, trailingEdge.y - 15);

        // Display airfoil information as text only
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Chord: 1.0 m", 20, height - 40);
        ctx.fillText(
          `Angle of Attack: ${angleOfAttack.toFixed(1)}°`,
          20,
          height - 20,
        );
      } else {
        // Simulator mode: Blue airfoil matching the reference image
        // Outer glow (Deep Blue)
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(59, 130, 246, 0.7)";
        ctx.lineWidth = 8;
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";

        ctx.beginPath();
        ctx.moveTo(airfoilCanvasPoints[0].x, airfoilCanvasPoints[0].y);
        for (let i = 1; i < airfoilCanvasPoints.length; i++) {
          ctx.lineTo(airfoilCanvasPoints[i].x, airfoilCanvasPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Main airfoil body - vibrant blue fill
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
        ctx.fillStyle = "rgba(59, 130, 246, 0.85)"; // Solid blue fill like reference image
        ctx.strokeStyle = "rgba(96, 165, 250, 0.9)"; // Lighter blue border
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(airfoilCanvasPoints[0].x, airfoilCanvasPoints[0].y);
        for (let i = 1; i < airfoilCanvasPoints.length; i++) {
          ctx.lineTo(airfoilCanvasPoints[i].x, airfoilCanvasPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Define leading and trailing edge points for reference
        const leadingEdge = transformPoint({ x: 0, y: 0 });
        const trailingEdge = transformPoint({ x: 1, y: 0 });

        // Calculate thickness for display
        let maxThickness = 0;
        let maxThicknessX = 0;
        for (let i = 0; i < rotated.upper.length; i++) {
          const thickness = rotated.upper[i].y - rotated.lower[i].y;
          if (thickness > maxThickness) {
            maxThickness = thickness;
            maxThicknessX = rotated.upper[i].x;
          }
        }

        // Display airfoil information as text only
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";

        // Chord length
        ctx.fillText("Chord: 1.0 m", 20, height - 60);

        // Maximum thickness
        ctx.fillText(
          `Max Thickness: ${(maxThickness * 100).toFixed(1)}%`,
          20,
          height - 40,
        );

        // Thickness location
        ctx.fillText(
          `Thickness at: ${(maxThicknessX * 100).toFixed(1)}% chord`,
          20,
          height - 20,
        );

        // Leading edge (orange/yellow control point)
        ctx.fillStyle = "#f59e0b"; // Amber/Orange
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(245, 158, 11, 0.7)";
        ctx.beginPath();
        ctx.arc(leadingEdge.x, leadingEdge.y, 7, 0, Math.PI * 2);
        ctx.fill();

        // Trailing edge (orange/yellow control point)
        ctx.fillStyle = "#f59e0b"; // Amber/Orange
        ctx.shadowColor = "rgba(245, 158, 11, 0.7)";
        ctx.beginPath();
        ctx.arc(trailingEdge.x, trailingEdge.y, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    width,
    height,
    upperCoefficients,
    lowerCoefficients,
    angleOfAttack,
    velocity,
    meshQuality,
    showPressureField,
    showVectorField,
    showMeshOverlay,
    designMode,
  ]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showControlPoints) return;

    const svg = overlayRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = controlPoints.find((pt) => {
      const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
      return dist < 10;
    });

    if (clicked) {
      setDraggedPoint(clicked);
      onControlPointDragStart?.();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedPoint) return;

    const svg = overlayRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Calculate new coefficient based on vertical position
    const scale = Math.min(width, height) * 0.5;
    const offsetY = height / 2;
    const newCoefficient = (offsetY - y) / scale;

    // Clamp to reasonable range
    const clampedCoeff = Math.max(-0.5, Math.min(0.5, newCoefficient));

    // Update coefficient (triggers re-render)
    onCoefficientChange(draggedPoint.surface, draggedPoint.index, clampedCoeff);
  };

  const handleMouseUp = () => {
    if (draggedPoint) {
      onControlPointDragEnd?.();
    }
    setDraggedPoint(null);
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    try {
      if (!isFullScreen) {
        // Request fullscreen on document body for better compatibility
        if (document.documentElement.requestFullscreen) {
          document.documentElement
            .requestFullscreen()
            .then(() => {
              setIsFullScreen(true);
            })
            .catch((err) => {
              console.warn("Fullscreen request failed:", err);
              setIsFullScreen(true); // Fallback visual state
            });
        } else {
          // Fallback for browsers without fullscreen API
          setIsFullScreen(true);
        }
      } else {
        // Exit fullscreen
        if (document.fullscreenElement) {
          document
            .exitFullscreen()
            .then(() => {
              setIsFullScreen(false);
            })
            .catch((err) => {
              console.warn("Exit fullscreen failed:", err);
              setIsFullScreen(false);
            });
        } else {
          setIsFullScreen(false);
        }
      }
    } catch (error) {
      console.warn("Fullscreen not supported or blocked:", error);
      setIsFullScreen(!isFullScreen);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${isFullScreen && !document.fullscreenElement ? "fixed inset-0 z-[9999] bg-gray-900" : ""}`}
      style={{
        backgroundColor:
          isFullScreen && !document.fullscreenElement
            ? "#0B1628"
            : "transparent",
      }}
    >
      {/* Canvas layer */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* SVG overlay for control points */}
      <svg
        ref={overlayRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ cursor: showControlPoints ? "crosshair" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Glowing Blue Filter */}
          <filter id="blueGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Deep Blue Outer Glow */}
          <filter
            id="deepBlueGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#2563eb" floodOpacity="0.6" />
            <feComposite in2="blur" operator="in" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {showControlPoints &&
          controlPoints.map((pt) => (
            <g key={pt.id}>
              {/* Outer glow ring */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="10"
                fill="none"
                stroke={designMode ? "#fbbf24" : "#f59e0b"}
                strokeWidth="1.5"
                opacity="0.3"
                className={draggedPoint?.id === pt.id ? "animate-pulse" : ""}
              />

              {/* Main control point */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill={
                  draggedPoint?.id === pt.id
                    ? designMode
                      ? "#fcd34d"
                      : "#fbbf24"
                    : designMode
                      ? "#fbbf24"
                      : "#f59e0b"
                }
                stroke="white"
                strokeWidth="2"
                className="cursor-grab active:cursor-grabbing transition-all hover:r-8"
                filter={designMode ? "none" : "url(#deepBlueGlow)"}
                style={{
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform:
                    draggedPoint?.id === pt.id ? "scale(1.1)" : "scale(1)",
                }}
              />

              {/* Inner highlight */}
              <circle
                cx={pt.x - 2}
                cy={pt.y - 2}
                r="2"
                fill="rgba(255, 255, 255, 0.6)"
                pointerEvents="none"
              />

              {/* Label with glassmorphism background */}
              <rect
                x={pt.x - 20}
                y={pt.y - 28}
                width="40"
                height="16"
                rx="6"
                fill="rgba(30, 64, 175, 0.95)"
                stroke={designMode ? "#fbbf24" : "#3b82f6"}
                strokeWidth="1"
                filter={designMode ? "none" : "url(#blueGlow)"}
                pointerEvents="none"
              />

              <text
                x={pt.x}
                y={pt.y - 18}
                fontSize="10"
                fontWeight="600"
                fill={designMode ? "#fbbf24" : "#1e40af"}
                textAnchor="middle"
                pointerEvents="none"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {pt.surface === "upper" ? "A" : "A"}
                <tspan
                  fontWeight="800"
                  fill={
                    designMode
                      ? "#fcd34d"
                      : pt.surface === "upper"
                        ? "#2563eb"
                        : "#059669"
                  }
                >
                  {pt.surface === "upper" ? "ᵤ" : "ₗ"}
                </tspan>
                <tspan fontSize="8" baselineShift="sub">
                  {pt.index}
                </tspan>
              </text>

              {/* Connection line to airfoil */}
              {draggedPoint?.id === pt.id && (
                <line
                  x1={pt.x}
                  y1={pt.y}
                  x2={pt.x}
                  y2={height / 2}
                  stroke={designMode ? "#fbbf24" : "#3b82f6"}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.4"
                  pointerEvents="none"
                />
              )}
            </g>
          ))}
      </svg>

      {/* Glassmorphism Full-screen toggle */}
      {allowFullScreen && (
        <motion.button
          onClick={toggleFullScreen}
          className="absolute top-4 right-4 p-3 rounded-xl shadow-2xl transition-all z-10 backdrop-blur-md"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            border: "2px solid rgba(59, 130, 246, 0.3)",
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 12px 48px rgba(59, 130, 246, 0.4)",
            borderColor: "#3b82f6",
          }}
          whileTap={{ scale: 0.95 }}
          initial={false}
          animate={isFullScreen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isFullScreen ? (
            <Minimize2 className="w-5 h-5 text-blue-600" />
          ) : (
            <Maximize2 className="w-5 h-5 text-blue-600" />
          )}
        </motion.button>
      )}
    </div>
  );
}
