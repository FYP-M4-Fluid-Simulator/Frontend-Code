import { PYTHON_BACKEND_URL } from "@/config";

export interface OptSessionConfig {
  userId?: string;
  upperCoefficients: number[];
  lowerCoefficients: number[];
  numIterations?: number;
  learningRate?: number;
  meshDensity?: "coarse" | "medium" | "fine" | "ultra";
  numSimSteps?: number;
  minThickness?: number;
  maxThickness?: number;
  inflow_velocity?: number;
}

export async function createOptSession(config: OptSessionConfig) {
  /**
   * POST /optimize/sessions on the Python FastAPI backend.
   *
   * Returns { session_id, config } — session_id is used to open
   * the WebSocket at /optimize/ws/{session_id}.
   */

  const fidelityMap: Record<string, string> = {
    coarse: "low",
    medium: "medium",
    fine: "coarse",
    ultra: "coarse",
  };

  const fidelity = fidelityMap[config.meshDensity || "coarse"];

  const res = await fetch(`${PYTHON_BACKEND_URL}/optimize/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: config.userId || "840c99b5-8322-4404-b345-cb039808e4e2",
      fidelity,
      cst_upper: config.upperCoefficients,
      cst_lower: config.lowerCoefficients,
      num_iterations: config.numIterations ?? 30,
      learning_rate: config.learningRate ?? 0.005,
      num_sim_steps: config.numSimSteps ?? 80,
      min_thickness: config.minThickness ?? 0.06,
      max_thickness: config.maxThickness ?? 0.25,
      inflow_velocity: config.inflow_velocity ?? 1.0,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Optimization session creation failed: ${res.status} ${errorText}`
    );
  }

  const data = await res.json();
  console.log("Optimization session response:", data);
  return data as { session_id: string; config: Record<string, unknown> };
}
