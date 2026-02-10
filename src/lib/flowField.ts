// Eulerian Flow Field Computation for Airfoil

/**
 * Check if a point is inside the airfoil polygon
 */
export function isPointInsideAirfoil(
  x: number,
  y: number,
  airfoilPoints: { x: number; y: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = airfoilPoints.length - 1; i < airfoilPoints.length; j = i++) {
    const xi = airfoilPoints[i].x;
    const yi = airfoilPoints[i].y;
    const xj = airfoilPoints[j].x;
    const yj = airfoilPoints[j].y;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculate distance from point to airfoil surface
 */
export function distanceToAirfoil(
  x: number,
  y: number,
  airfoilPoints: { x: number; y: number }[]
): number {
  let minDist = Infinity;

  for (let i = 0; i < airfoilPoints.length - 1; i++) {
    const x1 = airfoilPoints[i].x;
    const y1 = airfoilPoints[i].y;
    const x2 = airfoilPoints[i + 1].x;
    const y2 = airfoilPoints[i + 1].y;

    // Distance from point to line segment
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    minDist = Math.min(minDist, dist);
  }

  return minDist;
}

/**
 * Calculate potential flow around the airfoil (simplified)
 * Returns velocity components (vx, vy) and pressure coefficient
 * TO BE DONE BY THE SIMULATOR TEAM - currently demo version
 */
export function calculatePotentialFlow(
  x: number,
  y: number,
  airfoilPoints: { x: number; y: number }[],
  angleOfAttack: number,
  freeStreamVelocity: number
): { vx: number; vy: number; pressure: number; speed: number } {
  // Convert AoA to radians
  const alpha = (angleOfAttack * Math.PI) / 180;

  // Freestream velocity components
  const U_inf = freeStreamVelocity;
  const vx_inf = U_inf * Math.cos(alpha);
  const vy_inf = U_inf * Math.sin(alpha);

  // Check if inside airfoil
  const inside = isPointInsideAirfoil(x, y, airfoilPoints);
  if (inside) {
    return { vx: 0, vy: 0, pressure: 1.0, speed: 0 };
  }

  // Calculate distance to airfoil
  const dist = distanceToAirfoil(x, y, airfoilPoints);

  // Find nearest point on airfoil for flow deflection
  let nearestX = 0;
  let nearestY = 0;
  let minDist = Infinity;

  for (const point of airfoilPoints) {
    const d = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
    if (d < minDist) {
      minDist = d;
      nearestX = point.x;
      nearestY = point.y;
    }
  }

  // Calculate flow deflection around airfoil
  const dx = x - nearestX;
  const dy = y - nearestY;
  const distToSurface = Math.sqrt(dx * dx + dy * dy);

  // Influence factor (decreases with distance)
  const influence = Math.exp(-distToSurface * 2);

  // Perpendicular direction to surface
  const perpX = -dy / (distToSurface + 0.001);
  const perpY = dx / (distToSurface + 0.001);

  // Circulation effect (creates lift)
  const circulation = 2.0 * Math.sin(alpha);

  // Velocity perturbation due to airfoil
  const perturbX = perpX * circulation * influence;
  const perturbY = perpY * circulation * influence;

  // Total velocity
  let vx = vx_inf + perturbX;
  let vy = vy_inf + perturbY;

  // Speed-up over upper surface, slow-down at stagnation
  const chordPosition = nearestX; // Approximate chord position
  const isUpperSurface = nearestY > 0;

  if (distToSurface < 0.3) {
    if (isUpperSurface) {
      // Speed up on upper surface (low pressure)
      const speedFactor = 1.0 + (1.5 * influence * (1 + Math.sin(alpha)));
      vx *= speedFactor;
      vy *= speedFactor;
    } else {
      // Moderate speed on lower surface
      const speedFactor = 1.0 + (0.3 * influence);
      vx *= speedFactor;
      vy *= speedFactor;
    }

    // Stagnation point near leading edge
    if (chordPosition < 0.1) {
      const stagInfluence = Math.exp(-chordPosition * 10) * influence;
      vx *= (1 - stagInfluence * 0.9);
      vy *= (1 - stagInfluence * 0.9);
    }
  }

  // Calculate speed and pressure coefficient
  const speed = Math.sqrt(vx * vx + vy * vy);
  const speedRatio = speed / (U_inf + 0.001);

  // Bernoulli equation: Cp = 1 - (V/V_inf)^2
  const pressure = 1.0 - speedRatio * speedRatio;

  return { vx, vy, pressure, speed };
}

/**
 * Get color based on pressure coefficient
 * Red = high pressure (stagnation), Blue = low pressure (suction)
 */
export function getPressureColor(Cp: number): string {
  // Cp typically ranges from -3 (very low pressure) to +1 (stagnation)
  // Normalize to 0-1 range
  const normalized = Math.max(0, Math.min(1, (Cp + 3) / 4));

  if (normalized > 0.6) {
    // High pressure - Red/Orange
    const t = (normalized - 0.6) / 0.4;
    const r = Math.floor(255);
    const g = Math.floor(100 - t * 80);
    const b = Math.floor(50 - t * 50);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalized > 0.4) {
    // Medium pressure - Yellow/Green
    const t = (normalized - 0.4) / 0.2;
    const r = Math.floor(200 + t * 55);
    const g = Math.floor(200 - t * 100);
    const b = Math.floor(50);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Low pressure - Blue/Cyan
    const t = normalized / 0.4;
    const r = Math.floor(50 + t * 150);
    const g = Math.floor(150 + t * 50);
    const b = Math.floor(255);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Get glow intensity for neon effect
 */
export function getGlowIntensity(Cp: number): number {
  // Higher pressure differences = more glow
  const absCp = Math.abs(Cp - 0.5);
  return Math.min(1, absCp * 0.8);
}
