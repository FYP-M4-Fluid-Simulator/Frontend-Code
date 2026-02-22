"use client";
import { useEffect, useRef } from "react";

// ── Simulation constants (must match server defaults) ──────────────────────
const W = 256;
const H = 128;
const CELL = 4; // display pixels per grid cell

const CELL_SIZE = 0.01; // metres per grid cell
const CHORD_LENGTH = 40 * CELL_SIZE; // 0.4 m  (server default: 40 * cell_size)

// Airfoil leading-edge position in world coords (metres) – matches server defaults:
//   airfoil_offset_x = 30 * cell_size
//   airfoil_offset_y = (height // 2) * cell_size
const AIRFOIL_OFFSET_X = 30 * CELL_SIZE;
const AIRFOIL_OFFSET_Y = (H >> 1) * CELL_SIZE;

// ── CST maths (JS port of turbodiff/core/airfoil.py) ──────────────────────

/** Binomial coefficient C(n, k) */
function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/** CST class function: C(x) = sqrt(x) * (1 - x) */
function cstClass(x: number): number {
  return Math.sqrt(x) * (1 - x);
}

/** CST shape function: S(x) = sum_i w_i * B_{i,n}(x) */
function cstShape(x: number, weights: number[]): number {
  const n = weights.length - 1;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const B = binom(n, i) * Math.pow(x, i) * Math.pow(1 - x, n - i);
    s += weights[i] * B;
  }
  return s;
}

/**
 * Generate airfoil surface coordinates.
 * Returns arrays of { x, yUpper, yLower } in normalised chord space [0, 1].
 * Uses cosine spacing for better LE/TE resolution (matches Python implementation).
 */
function generateCSTCoords(
  upper: number[],
  lower: number[],
  numPoints = 200
): { x: number[]; yUpper: number[]; yLower: number[] } {
  const xs: number[] = [];
  const yU: number[] = [];
  const yL: number[] = [];

  for (let k = 0; k < numPoints; k++) {
    const beta = (Math.PI * k) / (numPoints - 1);
    const xi = 0.5 * (1 - Math.cos(beta)); // cosine spacing
    const C = cstClass(xi);
    xs.push(xi);
    yU.push(C * cstShape(xi, upper));
    yL.push(C * cstShape(xi, lower));
  }
  return { x: xs, yUpper: yU, yLower: yL };
}

/**
 * Convert normalised airfoil coords → world coords (m) → grid cell index → screen pixels.
 * The canvas is rendered flipped vertically (row 0 = bottom), so sy is mirrored:
 *   sy = (H * CELL) - raw_sy
 */
function toScreenPoints(
  xs: number[],
  ys: number[]
): { sx: number[]; sy: number[] } {
  const sx = xs.map((x) => ((AIRFOIL_OFFSET_X + x * CHORD_LENGTH) / CELL_SIZE) * CELL);
  // Mirror y so that the canvas is physically correct (y increases upward)
  const sy = ys.map((y) => H * CELL - ((AIRFOIL_OFFSET_Y + y * CHORD_LENGTH) / CELL_SIZE) * CELL);
  return { sx, sy };
}

// ── Component ──────────────────────────────────────────────────────────────

interface CFDCanvasProps {
  frameRef: React.MutableRefObject<any>;
  showVectorField?: boolean;
  visualizationType?: "curl" | "pressure" | "tracer";
  upperCoefficients?: number[];
  lowerCoefficients?: number[];
  angleOfAttack?: number;
}

export default function CFDCanvas({
  frameRef,
  showVectorField = true,
  visualizationType = "curl",
  upperCoefficients = [0.18, 0.22, 0.2, 0.18, 0.15, 0.12],
  lowerCoefficients = [-0.1, -0.08, -0.06, -0.05, -0.04, -0.03],
  angleOfAttack = 0,
}: CFDCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // Compute airfoil outline from the current CST coefficients
    const { x: afX, yUpper: afYU, yLower: afYL } = generateCSTCoords(
      upperCoefficients,
      lowerCoefficients
    );
    const { sx: afSX, sy: afSYU } = toScreenPoints(afX, afYU);
    const { sy: afSYL } = toScreenPoints(afX, afYL);

    let rafId: number;

    function loop() {
      rafId = requestAnimationFrame(loop);

      const frame = frameRef.current;
      if (!frame?.fields) return;

      const { u, v, curl, solid } = frame.fields as {
        u: number[][];
        v: number[][];
        curl: number[][];
        solid: number[][];
      };

      if (!curl || !solid || !u || !v) return;

      // ── 1. Clear ──────────────────────────────────────────────────
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, W * CELL, H * CELL);

      // ── 2. Draw cells: curl (red/blue) for all cells ─────────────
      // Canvas row 0 is at the top; grid row 0 is also at the top in memory,
      // but we want to display it flipped (physics y increases upward).
      // We mirror by drawing row i at canvas row (H - 1 - i).
      for (let i = 0; i < H; i++) {
        const screenRow = H - 1 - i; // vertical flip
        for (let j = 0; j < W; j++) {
          const c = curl[i][j];
          const r = Math.max(0, Math.min(255, Math.round(c * 5)));
          const b = Math.max(0, Math.min(255, Math.round(-c * 5)));
          ctx.fillStyle = `rgb(${r},0,${b})`;
          ctx.fillRect(j * CELL, screenRow * CELL, CELL, CELL);
        }
      }

      // ── 3. Draw velocity arrows ───────────────────────────────────
      if (showVectorField) {
        const ARROW_STEP = 4; // group this many cells per arrow
        for (let gi = 0; gi < H; gi += ARROW_STEP) {
          for (let gj = 0; gj < W; gj += ARROW_STEP) {
            // Average u/v over the group
            let sumU = 0, sumV = 0, count = 0;
            for (let di = 0; di < ARROW_STEP && gi + di < H; di++) {
              for (let dj = 0; dj < ARROW_STEP && gj + dj < W; dj++) {
                sumU += u[gi + di][gj + dj];
                sumV += v[gi + di][gj + dj];
                count++;
              }
            }
            const uij = sumU / count;
            const vij = sumV / count;
            const mag = Math.sqrt(uij * uij + vij * vij);

            if (mag < 0.05) continue;

            const clampedMag = Math.min(mag, 1.0);
            const magSafe = Math.max(mag, 1e-6);
            const uDir = uij / magSafe;
            // Flip v direction since canvas y-axis is inverted
            const vDir = -(vij / magSafe);

            const r = Math.round(255 * clampedMag);
            const b = Math.round(255 * (1 - clampedMag));
            ctx.strokeStyle = `rgb(${r},128,${b})`;
            ctx.lineWidth = 1.5;

            // Arrow spans ~70% of the group cell size
            const scale = ARROW_STEP * CELL * 0.7 * clampedMag;
            const cx = (gj + ARROW_STEP / 2) * CELL;
            // Mirror the group centre y
            const cy = (H - 1 - gi - ARROW_STEP / 2) * CELL;
            const endX = cx + scale * uDir;
            const endY = cy + scale * vDir;

            // Shaft
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Arrowhead
            const headLen = Math.max(4, scale * 0.3);
            const angle = Math.atan2(vDir, uDir);
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLen * Math.cos(angle - Math.PI / 6),
              endY - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLen * Math.cos(angle + Math.PI / 6),
              endY - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        }
      }

      // ── 4. Draw CST airfoil outline (white, 2 px) ─────────────────
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;

      // Rotate the outline around the chord midpoint to match angle of attack.
      // Canvas y is inverted (after our vertical flip the visual y increases
      // upward), so a positive AoA must use a negative canvas rotation angle.
      const midIdx = Math.floor(afSX.length / 2); // index closest to x_norm = 0.5
      const pivotX = afSX[midIdx];
      const pivotY = (afSYU[midIdx] + afSYL[midIdx]) / 2; // mid-thickness point
      const aoaRad = -(angleOfAttack * Math.PI) / 180;

      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(aoaRad);

      // Build the full closed airfoil path (upper TE→LE, lower LE→TE)
      ctx.beginPath();
      ctx.moveTo(afSX[0] - pivotX, afSYU[0] - pivotY);
      for (let k = 1; k < afSX.length; k++) {
        ctx.lineTo(afSX[k] - pivotX, afSYU[k] - pivotY);
      }
      // trace lower surface back to leading edge to close the shape
      for (let k = afSX.length - 1; k >= 0; k--) {
        ctx.lineTo(afSX[k] - pivotX, afSYL[k] - pivotY);
      }
      ctx.closePath();

      // Light-gray fill
      ctx.fillStyle = "rgba(200, 200, 200, 0.75)";
      ctx.fill();

      // White outline
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    loop();
    return () => cancelAnimationFrame(rafId);
  }, [frameRef, showVectorField, visualizationType, upperCoefficients, lowerCoefficients, angleOfAttack]);

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={W * CELL}
        height={H * CELL}
        className="w-full h-full"
      />
    </div>
  );
}