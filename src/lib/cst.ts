// CST (Class Shape Transformation) Mathematics Library
// Matches the Python implementation for accurate airfoil generation

/**
 * Factorial calculation
 */
const factorial = (n: number): number => {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

/**
 * Binomial coefficient calculation (nCr) - K in Python code
 */
const nCr = (n: number, r: number): number => {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  return factorial(n) / (factorial(r) * factorial(n - r));
};

/**
 * Class Shape Function - matches Python implementation
 * Calculates y-coordinates for a given surface
 */
function classShape(
  weights: number[],
  x: number[],
  dz: number,
  N1 = 0.5,
  N2 = 1.0,
) {
  const n = weights.length - 1; // Order of Bernstein polynomial

  // Pre-compute Bernstein coefficients (the 'K' in Python)
  const K = Array.from({ length: n + 1 }, (_, i) => nCr(n, i));

  // Calculate y-coordinates for each x
  return x.map((xi) => {
    // 1. Class Function
    const C = Math.pow(xi, N1) * Math.pow(1 - xi, N2);

    // 2. Shape Function (Bernstein Polynomial)
    let S = 0;
    for (let j = 0; j <= n; j++) {
      S += weights[j] * K[j] * Math.pow(xi, j) * Math.pow(1 - xi, n - j);
    }

    // 3. Calculate final y-coordinate
    // y = C * S + x * dz
    return C * S + xi * dz;
  });
}

/**
 * Generate complete CST airfoil - matches Python cst_airfoil function
 * Uses cosine spacing for proper point distribution
 */
export function generateCSTAirfoil(
  upperWeights: number[],
  lowerWeights: number[],
  dz = 0,
  numPoints = 100,
) {
  // 1. Generate x-coordinates using cosine spacing (like in Python)
  const zeta = Array.from({ length: numPoints + 1 }, (_, i) => ((2 * Math.PI) / numPoints) * i);
  const x = zeta.map((z) => 0.5 * (Math.cos(z) + 1));

  // 2. Find the leading edge (LE) index
  const zerind = x.indexOf(Math.min(...x));

  // 3. Split x-coordinates for lower and upper surfaces
  const xl = x.slice(0, zerind); // Lower surface x-coordinates
  const xu = x.slice(zerind); // Upper surface x-coordinates

  // 4. Calculate y-coordinates for both surfaces
  const yl = classShape(lowerWeights, xl, -dz, 0.5, 1.0); // Lower surface
  const yu = classShape(upperWeights, xu, dz, 0.5, 1.0); // Upper surface

  // 5. Combine coordinates
  const y = [...yl, ...yu];


  console.log("=== CST Airfoil Generation ===");
  for (let i = 0; i < y.length; i++) {
      console.log(`x[${i}] = ${x[i].toFixed(6)}, y[${i}] = ${y[i].toFixed(6)}`);
  }



  // Create coordinate arrays
  const coordinates = x.map((xi, i) => ({ x: xi, y: y[i] }));
  const upperCoordinates = xu.map((xi, i) => ({ x: xi, y: yu[i] }));
  const lowerCoordinates = xl.map((xi, i) => ({ x: xi, y: yl[i] }));

  return {
    coordinates,
    upperCoordinates,
    lowerCoordinates,
  };
}

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use generateCSTAirfoil instead
 */
export function generateAirfoil(
  upperCoefficients: number[],
  lowerCoefficients: number[],
  numPoints: number = 100,
  trailingEdgeThickness: number = 0
): { upper: { x: number; y: number }[]; lower: { x: number; y: number }[] } {
  const result = generateCSTAirfoil(upperCoefficients, lowerCoefficients, trailingEdgeThickness, numPoints);
  return {
    upper: result.upperCoordinates,
    lower: result.lowerCoordinates,
  };
}

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use generateCSTAirfoil instead
 */
export function calculateCSTCurve(
  coefficients: number[],
  numPoints: number = 100,
  N1: number = 0.5,
  N2: number = 1.0,
  dz_te: number = 0
): { x: number; y: number }[] {
  // Use linear spacing for legacy compatibility
  const x = Array.from({ length: numPoints + 1 }, (_, i) => i / numPoints);
  const y = classShape(coefficients, x, dz_te, N1, N2);
  
  return x.map((xi, i) => ({ x: xi, y: y[i] }));
}

/**
 * Convert airfoil coordinates to SVG path
 */
export function airfoilToSVGPath(
  upper: { x: number; y: number }[],
  lower: { x: number; y: number }[],
  scale: number = 400,
  offsetX: number = 100,
  offsetY: number = 200
): string {
  if (upper.length === 0 || lower.length === 0) return '';
  
  // Start at trailing edge (x=1)
  let path = `M ${offsetX + upper[upper.length - 1].x * scale} ${offsetY - upper[upper.length - 1].y * scale}`;
  
  // Upper surface (trailing edge to leading edge)
  for (let i = upper.length - 1; i >= 0; i--) {
    path += ` L ${offsetX + upper[i].x * scale} ${offsetY - upper[i].y * scale}`;
  }
  
  // Lower surface (leading edge to trailing edge)
  for (let i = 0; i < lower.length; i++) {
    path += ` L ${offsetX + lower[i].x * scale} ${offsetY - lower[i].y * scale}`;
  }
  
  path += ' Z';
  return path;
}

/**
 * Rotate a point around origin
 */
export function rotatePoint(x: number, y: number, angle: number): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
}

/**
 * Apply rotation to entire airfoil
 */
export function rotateAirfoil(
  upper: { x: number; y: number }[],
  lower: { x: number; y: number }[],
  angle: number,
  centerX: number = 0.25
): { upper: { x: number; y: number }[]; lower: { x: number; y: number }[] } {
  const rotateAboutCenter = (points: { x: number; y: number }[]) => {
    return points.map(p => {
      // Translate to center
      const tx = p.x - centerX;
      const ty = p.y;
      
      // Rotate
      const rotated = rotatePoint(tx, ty, angle);
      
      // Translate back
      return {
        x: rotated.x + centerX,
        y: rotated.y
      };
    });
  };
  
  return {
    upper: rotateAboutCenter(upper),
    lower: rotateAboutCenter(lower)
  };
}
