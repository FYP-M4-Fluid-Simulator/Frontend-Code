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

      // Clear with BLACK background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Draw pressure field heatmap (ANSYS-style smooth contours)
      if (showPressureField) {
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

      // Draw mesh overlay (sharp Eulerian grid)
      if (showMeshOverlay) {
        ctx.strokeStyle = designMode
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1.0;

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

      // Draw vector field with dynamic arrows
      if (showVectorField) {
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
        // In design mode: White airfoil with black grid cells
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(airfoilCanvasPoints[0].x, airfoilCanvasPoints[0].y);
        for (let i = 1; i < airfoilCanvasPoints.length; i++) {
          ctx.lineTo(airfoilCanvasPoints[i].x, airfoilCanvasPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Leading edge marker (black)
        const leadingEdge = transformPoint({ x: 0, y: 0 });
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.arc(leadingEdge.x, leadingEdge.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Trailing edge marker (black)
        const trailingEdge = transformPoint({ x: 1, y: 0 });
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.arc(trailingEdge.x, trailingEdge.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Small wind speed indicators (subtle black arrows)
        if (showVectorField) {
          const arrowSpacing = gridSpacing * 2.5;

          for (
            let x = arrowSpacing;
            x < width - arrowSpacing;
            x += arrowSpacing
          ) {
            const y = offsetY - 50; // Single horizontal line above airfoil

            const angle = (angleOfAttack * Math.PI) / 180;
            const arrowLength = 12 + (velocity / 100) * 8; // Small arrows

            const endX = x + Math.cos(angle) * arrowLength;
            const endY = y + Math.sin(angle) * arrowLength;

            ctx.strokeStyle = "rgba(100, 180, 255, 0.5)"; // Light cyan/blue for visibility on black
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Arrow head
            const headLength = 4;
            const headAngle = Math.PI / 6;

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
          }
        }
      } else {
        // Simulator mode: Blue glow airfoil
        // Outer glow (Deep Blue)
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
        ctx.lineWidth = 8;
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";

        ctx.beginPath();
        ctx.moveTo(airfoilCanvasPoints[0].x, airfoilCanvasPoints[0].y);
        for (let i = 1; i < airfoilCanvasPoints.length; i++) {
          ctx.lineTo(airfoilCanvasPoints[i].x, airfoilCanvasPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Main airfoil body
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.97)";
        ctx.strokeStyle = "#2563eb";
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

        // Leading edge (red stagnation point)
        const leadingEdge = transformPoint({ x: 0, y: 0 });
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(239, 68, 68, 0.7)";
        ctx.beginPath();
        ctx.arc(leadingEdge.x, leadingEdge.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Trailing edge (cyan)
        const trailingEdge = transformPoint({ x: 1, y: 0 });
        ctx.fillStyle = "#06b6d4";
        ctx.shadowColor = "rgba(6, 182, 212, 0.7)";
        ctx.beginPath();
        ctx.arc(trailingEdge.x, trailingEdge.y, 8, 0, Math.PI * 2);
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
    setDraggedPoint(null);
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    try {
      if (!isFullScreen) {
        // Request fullscreen
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen().catch((err) => {
            console.warn("Fullscreen request failed:", err);
            // Fallback: Just maximize the container visually
            setIsFullScreen(true);
          });
        } else {
          // Fallback for browsers without fullscreen API
          setIsFullScreen(true);
        }
      } else {
        // Exit fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => {
            console.warn("Exit fullscreen failed:", err);
            setIsFullScreen(false);
          });
        } else {
          setIsFullScreen(false);
        }
      }
    } catch (error) {
      console.warn("Fullscreen not supported or blocked:", error);
      // Toggle visual state even if native fullscreen fails
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
      className={`relative w-full h-full ${isFullScreen && !document.fullscreenElement ? "fixed inset-0 z-50 bg-black" : ""}`}
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
                stroke={
                  designMode
                    ? pt.surface === "upper"
                      ? "#2563eb"
                      : "#059669"
                    : "#3b82f6"
                }
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
                      ? pt.surface === "upper"
                        ? "#60a5fa"
                        : "#10b981"
                      : "#60a5fa"
                    : designMode
                      ? pt.surface === "upper"
                        ? "#2563eb"
                        : "#059669"
                      : "#3b82f6"
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
                fill="rgba(255, 255, 255, 0.95)"
                stroke={
                  designMode
                    ? pt.surface === "upper"
                      ? "#2563eb"
                      : "#059669"
                    : "#3b82f6"
                }
                strokeWidth="1"
                filter={designMode ? "none" : "url(#blueGlow)"}
                pointerEvents="none"
              />

              <text
                x={pt.x}
                y={pt.y - 18}
                fontSize="10"
                fontWeight="600"
                fill={designMode ? "#374151" : "#1e40af"}
                textAnchor="middle"
                pointerEvents="none"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {pt.surface === "upper" ? "A" : "A"}
                <tspan
                  fontWeight="800"
                  fill={pt.surface === "upper" ? "#2563eb" : "#059669"}
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
                  stroke={
                    designMode
                      ? pt.surface === "upper"
                        ? "#2563eb"
                        : "#059669"
                      : "#3b82f6"
                  }
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
