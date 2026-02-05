// CST (Class Shape Transformation) Mathematics Library

/**
 * Binomial coefficient calculation
 */
function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i) / (i + 1);
  }
  return result;
}

/**
 * Bernstein polynomial basis function
 */
function bernstein(n: number, i: number, x: number): number {
  return binomial(n, i) * Math.pow(x, i) * Math.pow(1 - x, n - i);
}

/**
 * Class function for CST parameterization
 * C(x) = x^N1 * (1-x)^N2
 */
function classFunction(x: number, N1: number = 0.5, N2: number = 1.0): number {
  return Math.pow(x, N1) * Math.pow(1 - x, N2);
}

/**
 * Shape function using Bernstein polynomials
 * S(x) = sum(A_i * K_i(x)) where K_i is Bernstein basis
 */
function shapeFunction(x: number, coefficients: number[]): number {
  const n = coefficients.length - 1;
  let sum = 0;
  
  for (let i = 0; i <= n; i++) {
    sum += coefficients[i] * bernstein(n, i, x);
  }
  
  return sum;
}

/**
 * Complete CST curve calculation
 * y(x) = C(x) * S(x) + x * dz_te
 */
export function calculateCSTCurve(
  coefficients: number[],
  numPoints: number = 100,
  N1: number = 0.5,
  N2: number = 1.0,
  dz_te: number = 0
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const x = i / numPoints;
    const C = classFunction(x, N1, N2);
    const S = shapeFunction(x, coefficients);
    const y = C * S + x * dz_te;
    
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Generate complete airfoil from upper and lower CST coefficients
 */
export function generateAirfoil(
  upperCoefficients: number[],
  lowerCoefficients: number[],
  numPoints: number = 100
): { upper: { x: number; y: number }[]; lower: { x: number; y: number }[] } {
  // Upper surface (N1=0.5, N2=1.0)
  const upper = calculateCSTCurve(upperCoefficients, numPoints, 0.5, 1.0, 0);
  
  // Lower surface (N1=0.5, N2=1.0)
  const lower = calculateCSTCurve(lowerCoefficients, numPoints, 0.5, 1.0, 0);
  
  return { upper, lower };
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
