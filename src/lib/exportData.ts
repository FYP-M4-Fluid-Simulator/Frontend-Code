// Data Export Utilities for Backend API Transmission

export interface CSTParameters {
  upperCoefficients: number[];
  lowerCoefficients: number[];
  numPoints: number;
  classParameters: {
    N1: number;
    N2: number;
  };
}

export interface FlowConditions {
  velocity: number; // m/s
  angleOfAttack: number; // degrees
  reynoldsNumber: number;
  machNumber: number;
  temperature: number; // Kelvin
  pressure: number; // Pa
}

export interface MeshSettings {
  quality: "coarse" | "medium" | "fine" | "ultra";
  nodeCount: number;
  refinementRegions: {
    leadingEdge: number;
    trailingEdge: number;
    wake: number;
  };
  gridType: "structured" | "unstructured";
}

export interface OptimizationParameters {
  targetLiftDrag: number;
  thicknessConstraint: number;
  maxIterations: number;
  algorithm: "genetic" | "gradient" | "pso";
  convergenceTolerance: number;
}

export interface SimulationConfig {
  timestamp: string;
  version: string;
  cst: CSTParameters;
  flow: FlowConditions;
  mesh: MeshSettings;
  optimization?: OptimizationParameters;
  metadata: {
    airfoilName: string;
    description: string;
    tags: string[];
  };
}

/**
 * Create a complete simulation configuration for export
 */
export function createSimulationConfig(
  upperCoefficients: number[],
  lowerCoefficients: number[],
  velocity: number,
  angleOfAttack: number,
  meshQuality: "coarse" | "medium" | "fine" | "ultra",
  optimization?: OptimizationParameters,
): SimulationConfig {
  const nodeCount = {
    coarse: 5000,
    medium: 15000,
    fine: 40000,
    ultra: 100000,
  }[meshQuality];

  const reynoldsNumber = velocity * 10000; // Simplified
  const machNumber = velocity / 343; // Speed of sound at sea level

  return {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    cst: {
      upperCoefficients,
      lowerCoefficients,
      numPoints: 100,
      classParameters: {
        N1: 0.5,
        N2: 1.0,
      },
    },
    flow: {
      velocity,
      angleOfAttack,
      reynoldsNumber,
      machNumber,
      temperature: 288.15, // 15°C
      pressure: 101325, // 1 atm
    },
    mesh: {
      quality: meshQuality,
      nodeCount,
      refinementRegions: {
        leadingEdge: 3,
        trailingEdge: 2,
        wake: 1.5,
      },
      gridType: "structured",
    },
    optimization,
    metadata: {
      airfoilName: "Custom CST Airfoil",
      description: "Generated via TurboDiff Designer",
      tags: ["CST", "Wind Turbine", "Optimization"],
    },
  };
}

/**
 * Export configuration as JSON string
 */
export function exportAsJSON(config: SimulationConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Export configuration as downloadable file
 */
export function downloadConfigFile(
  config: SimulationConfig,
  filename: string = "airfoil-config.json",
) {
  const jsonString = exportAsJSON(config);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prepare data for backend API transmission
 */
export async function sendToBackendAPI(
  config: SimulationConfig,
  endpoint: string = "/api/simulate",
): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: exportAsJSON(config),
  });
}

/**
 * Generate mesh coordinates for visualization
 */
export function generateMeshCoordinates(
  width: number,
  height: number,
  meshQuality: "coarse" | "medium" | "fine" | "ultra",
): { x: number; y: number }[] {
  const spacing = {
    coarse: 40,
    medium: 25,
    fine: 15,
    ultra: 10,
  }[meshQuality];

  const points: { x: number; y: number }[] = [];

  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      points.push({ x, y });
    }
  }

  return points;
}

/**
 * Export airfoil coordinates as .dat file (Selig format)
 */
export function downloadDatFile(
  upperCoords: { x: number; y: number }[],
  lowerCoords: { x: number; y: number }[],
  airfoilName: string = "Custom Airfoil",
) {
  let datContent = `${airfoilName}\n`;

  // Combine upper and lower surfaces (upper from trailing edge to leading edge, then lower from leading edge to trailing edge)
  const upperReversed = [...upperCoords].reverse();
  const allCoords = [...upperReversed, ...lowerCoords];

  // Write coordinates in Selig format (x y on each line)
  allCoords.forEach((coord) => {
    datContent += `  ${coord.x.toFixed(6)}  ${coord.y.toFixed(6)}\n`;
  });

  const blob = new Blob([datContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${airfoilName.replace(/\s+/g, "_")}.dat`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export CST parameters as downloadable file
 */
export function downloadCSTParameters(
  upperCoefficients: number[],
  lowerCoefficients: number[],
  filename: string = "cst-parameters.json",
) {
  const cstData = {
    timestamp: new Date().toISOString(),
    parameterization: "CST",
    classParameters: {
      N1: 0.5,
      N2: 1.0,
    },
    upperCoefficients,
    lowerCoefficients,
    numCoefficients: {
      upper: upperCoefficients.length,
      lower: lowerCoefficients.length,
    },
  };

  const jsonString = JSON.stringify(cstData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export optimization metrics as CSV file
 */
export interface OptimizationMetrics {
  liftCoefficient: number;
  dragCoefficient: number;
  momentCoefficient?: number;
  liftToDragRatio: number;
  angleOfAttack: number;
  velocity: number;
  reynoldsNumber?: number;
}

export function downloadMetricsCSV(
  metrics: OptimizationMetrics | OptimizationMetrics[],
  filename: string = "optimization-metrics.csv",
) {
  const metricsArray = Array.isArray(metrics) ? metrics : [metrics];

  let csvContent = "Angle of Attack (deg),Velocity (m/s),Lift Coefficient (C_L),Drag Coefficient (C_D),Moment Coefficient (C_M),Lift-to-Drag Ratio (L/D),Reynolds Number\n";

  metricsArray.forEach((m) => {
    const cmVal = m.momentCoefficient !== undefined ? m.momentCoefficient.toFixed(6) : "N/A";
    csvContent += `${m.angleOfAttack},${m.velocity},${m.liftCoefficient.toFixed(6)},${m.dragCoefficient.toFixed(6)},${cmVal},${m.liftToDragRatio.toFixed(3)},${m.reynoldsNumber || "N/A"}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export optimization metrics as JSON file
 */
export function downloadMetricsJSON(
  metrics: OptimizationMetrics | OptimizationMetrics[],
  filename: string = "optimization-metrics.json",
) {
  const data = {
    timestamp: new Date().toISOString(),
    metrics: Array.isArray(metrics) ? metrics : [metrics],
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Save experiment to backend
 */
export interface ExperimentData {
  name: string;
  description?: string;
  cstParameters: {
    upperCoefficients: number[];
    lowerCoefficients: number[];
  };
  flowConditions: {
    velocity: number;
    angleOfAttack: number;
  };
  meshQuality: "coarse" | "medium" | "fine" | "ultra";
  results?: {
    metrics?: OptimizationMetrics;
    airfoilCoordinates?: {
      upper: { x: number; y: number }[];
      lower: { x: number; y: number }[];
    };
  };
}

export async function saveExperimentToBackend(
  experimentData: ExperimentData,
  backendUrl: string,
): Promise<Response> {
  return fetch(`${backendUrl}/experiments/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(experimentData),
  });
}

/**
 * Load experiment from backend
 */
export async function loadExperimentFromBackend(
  experimentId: string,
  backendUrl: string,
): Promise<ExperimentData> {
  const response = await fetch(`${backendUrl}/experiments/${experimentId}`);
  if (!response.ok) {
    throw new Error("Failed to load experiment");
  }
  return response.json();
}
