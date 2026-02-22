"use client";
import { useEffect, useRef } from "react";

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
 * Uses cosine spacing for better LE/TE resolution.
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
    const xi = 0.5 * (1 - Math.cos(beta));
    const C = cstClass(xi);
    xs.push(xi);
    yU.push(C * cstShape(xi, upper));
    yL.push(C * cstShape(xi, lower));
  }
  return { x: xs, yUpper: yU, yLower: yL };
}

/**
 * Convert normalised airfoil coords → screen pixels.
 *
 * @param xs          normalised x coords [0, 1]
 * @param ys          normalised y coords
 * @param cellSize    metres per grid cell
 * @param chordLength metres of chord (= 40 * cellSize by server convention)
 * @param offsetX     leading-edge x in metres (= 30 * cellSize)
 * @param offsetY     centre-line y in metres (= height/2 * cellSize)
 * @param H           grid rows
 * @param cellPx      display pixels per grid cell
 */
function toScreenPoints(
  xs: number[],
  ys: number[],
  cellSize: number,
  chordLength: number,
  offsetX: number,
  offsetY: number,
  H: number,
  cellPx: number
): { sx: number[]; sy: number[] } {
  const sx = xs.map((x) => ((offsetX + x * chordLength) / cellSize) * cellPx);
  // Mirror y: physics y increases upward, canvas y increases downward
  const sy = ys.map(
    (y) => H * cellPx - ((offsetY + y * chordLength) / cellSize) * cellPx
  );
  return { sx, sy };
}

// ── Display pixels per cell — kept constant so the canvas doesn't get huge ──
// For each fidelity level the server sends a different (W, H).  We scale the
// cell pixel size so the canvas always fits a reasonable screen area.
function cellPixelsForGrid(W: number, H: number): number {
  // Target canvas width ≈ 1024 px, never less than 1 px/cell.
  const byWidth = Math.max(1, Math.round(1024 / W));
  const byHeight = Math.max(1, Math.round(600 / H));
  return Math.min(byWidth, byHeight);
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

  // Precompute CST outline whenever coefficients change
  const { x: afX, yUpper: afYU, yLower: afYL } = generateCSTCoords(
    upperCoefficients,
    lowerCoefficients
  );

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let rafId: number;
    // Track the last grid dimensions so we only resize the canvas element
    // when the server sends a different resolution.
    let lastW = 0;
    let lastH = 0;
    let lastCellPx = 0;

    function loop() {
      rafId = requestAnimationFrame(loop);

      const frame = frameRef.current;
      if (!frame?.fields || !frame?.meta) return;

      const { u, v, curl, solid } = frame.fields as {
        u: number[][];
        v: number[][];
        curl: number[][];
        solid: number[][];
      };

      if (!curl || !solid || !u || !v) return;

      // ── Derive grid dimensions from the live frame metadata ──────────
      const W: number = frame.meta.width;
      const H: number = frame.meta.height;
      const cellSize: number = frame.meta.cell_size; // metres

      const CELL = cellPixelsForGrid(W, H); // display pixels per cell

      // Resize canvas only when the grid resolution changes
      if (W !== lastW || H !== lastH || CELL !== lastCellPx) {
        canvas.width  = W * CELL;
        canvas.height = H * CELL;
        lastW = W;
        lastH = H;
        lastCellPx = CELL;
      }

      // Physical geometry — read directly from the frame meta so the canvas
      // is always in sync with whatever values the backend resolved.
      // Fall back to convention-based defaults for backwards compatibility.
      const chordLength: number =
        frame.meta.chord_length;
      const offsetX: number =
        frame.meta.airfoil_offset_x;
      const offsetY: number =
        frame.meta.airfoil_offset_y;

      // Recompute screen-space airfoil points with the live geometry
      const { sx: afSX, sy: afSYU } = toScreenPoints(
        afX, afYU, cellSize, chordLength, offsetX, offsetY, H, CELL
      );
      const { sy: afSYL } = toScreenPoints(
        afX, afYL, cellSize, chordLength, offsetX, offsetY, H, CELL
      );

      // ── 1. Clear ──────────────────────────────────────────────────
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, W * CELL, H * CELL);

      // ── 2. Draw cells (curl / pressure / solid) ───────────────────
      // Canvas row 0 is top; physics row 0 is also top in memory,
      // but we want to display flipped so physics y increases upward.
      // We mirror by drawing row i at canvas row (H - 1 - i).
      for (let i = 0; i < H; i++) {
        const screenRow = H - 1 - i;
        for (let j = 0; j < W; j++) {
          let r = 0, g = 0, b = 0;

          if (visualizationType === "pressure") {
            const p = frame.fields.pressure?.[i]?.[j] ?? 0;
            r = Math.max(0, Math.min(255, Math.round(p * 50)));
            b = Math.max(0, Math.min(255, Math.round(-p * 50)));
          } else {
            // Default: curl (vorticity)
            const c = curl[i][j];
            r = Math.max(0, Math.min(255, Math.round(c * 5)));
            b = Math.max(0, Math.min(255, Math.round(-c * 5)));
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(j * CELL, screenRow * CELL, CELL, CELL);
        }
      }

      // ── 3. Draw velocity arrows ───────────────────────────────────
      if (showVectorField) {
        // Arrow step scales with cell pixel size so arrows don't crowd on
        // large grids or vanish on small ones.
        const ARROW_STEP = Math.max(4, Math.round(16 / CELL));
        for (let gi = 0; gi < H; gi += ARROW_STEP) {
          for (let gj = 0; gj < W; gj += ARROW_STEP) {
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
            const vDir = -(vij / magSafe); // flip v for canvas coords

            ctx.strokeStyle = `rgb(${Math.round(255 * clampedMag)},128,${Math.round(255 * (1 - clampedMag))})`;
            ctx.lineWidth = 1.5;

            const scale = ARROW_STEP * CELL * 0.7 * clampedMag;
            const cx = (gj + ARROW_STEP / 2) * CELL;
            const cy = (H - 1 - gi - ARROW_STEP / 2) * CELL;
            const endX = cx + scale * uDir;
            const endY = cy + scale * vDir;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            const headLen = Math.max(4, scale * 0.3);
            const angle = Math.atan2(vDir, uDir);
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
        }
      }

      // ── 4. Draw CST airfoil outline ───────────────────────────────
      const midIdx = Math.floor(afSX.length / 2);
      const pivotX = afSX[midIdx];
      const pivotY = (afSYU[midIdx] + afSYL[midIdx]) / 2;
      const aoaRad = -(angleOfAttack * Math.PI) / 180;

      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(aoaRad);

      ctx.beginPath();
      ctx.moveTo(afSX[0] - pivotX, afSYU[0] - pivotY);
      for (let k = 1; k < afSX.length; k++) {
        ctx.lineTo(afSX[k] - pivotX, afSYU[k] - pivotY);
      }
      for (let k = afSX.length - 1; k >= 0; k--) {
        ctx.lineTo(afSX[k] - pivotX, afSYL[k] - pivotY);
      }
      ctx.closePath();

      ctx.fillStyle = "rgba(200, 200, 200, 0.75)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    loop();
    return () => cancelAnimationFrame(rafId);
  }, [
    frameRef,
    showVectorField,
    visualizationType,
    upperCoefficients,
    lowerCoefficients,
    angleOfAttack,
  ]);

  return (
    <div className="w-full h-full bg-black">
      <canvas
        ref={canvasRef}
        // Internal buffer size — overwritten by the render loop once the first
        // frame arrives and the real grid dimensions are known.
        width={1024}
        height={512}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}