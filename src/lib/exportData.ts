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
