import { PYTHON_BACKEND_URL } from "@/config";
import { auth } from "../firebase/config";

export interface OptSessionConfig {
  userId?: string;
  upperCoefficients: number[];
  lowerCoefficients: number[];
  numIterations?: number;
  learningRate?: number;
  meshDensity?: "coarse" | "medium" | "fine" | "ultra";
  chordLength?: number;
  numSimSteps?: number;
  timeStepSize?: number;
  simulationDuration?: number;
  minThickness?: number;
  maxThickness?: number;
  inflow_velocity?: number;
  angle_of_attack?: number;
  reynoldsNumber?: number;  
  runId?: string;
}

export async function createOptSession(config: OptSessionConfig) {
  /**
   * POST /optimize/sessions on the Python FastAPI backend.
   *
   * Returns { session_id, config } — session_id is used to open
   * the WebSocket at /optimize/ws/{session_id}.
   */

  // Map frontend meshDensity labels to backend fidelity keys.
  const fidelityMap: Record<string, string> = {
    coarse: "low",
    medium: "medium",
    fine:   "high",
    ultra:  "ultra",
  };

  const density = config.meshDensity || "coarse";
  const fidelity = fidelityMap[density];

  const token = await auth.currentUser?.getIdToken();

  // Logic: dt and num_sim_steps (derived from simulationDuration if provided)
  const dt = config.timeStepSize || 0.0002;
  const duration = config.simulationDuration || 0.2; // Default 0.2s matching backend 1000 steps at 0.0002dt
  const num_sim_steps = config.numSimSteps || Math.floor(duration / dt);

  const res = await fetch(`${PYTHON_BACKEND_URL}/optimize/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      fidelity,
      chord_length: config.chordLength ?? 1.0,
      cst_upper: config.upperCoefficients,
      cst_lower: config.lowerCoefficients,
      num_iterations: config.numIterations ?? 30,
      learning_rate: config.learningRate ?? 0.005,
      dt: dt,
      num_sim_steps: num_sim_steps,
      min_thickness: config.minThickness ?? 0.06,
      max_thickness: config.maxThickness ?? 0.25,
      inflow_velocity: config.inflow_velocity ?? 1.0,
      angle_of_attack: config.angle_of_attack ?? 0.0,
      reynolds_number: config.reynoldsNumber || 1000000,
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
