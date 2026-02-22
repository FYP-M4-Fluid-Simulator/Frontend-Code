import { PYTHON_BACKEND_URL } from "@/config";
import { auth } from "../firebase/config";

export interface SessionConfig {
  userId?: string;
  upperCoefficients: number[];
  lowerCoefficients: number[];
  velocity?: number;
  angleOfAttack?: number;
  meshDensity?: "coarse" | "medium" | "fine" | "ultra";
  chordLength?: number;
  timeStepSize?: number;
  simulationDuration?: number;
  runId?: string;
}

export async function createSession(config: SessionConfig) {
  /**
   * This function sends a POST request to the 
   * Python FASTAPI backend to start a websocket session
 
   * params:
   *        - userId: string (optional, defaults to random UUID)
   *        - upperCoefficients: number[] (CST upper surface weights)
   *        - lowerCoefficients: number[] (CST lower surface weights)
   *        - velocity: number (inflow velocity in m/s)
   *        - angleOfAttack: number (angle of attack in degrees)
   *        - meshDensity: "coarse" | "medium" | "fine" | "ultra"
   *        - timeStepSize: number (dt in seconds)
   *        - simulationDuration: number (total sim time in seconds)
   * returns:
   *        - session_id: string (UUID for the session)
   *        - config: object (session configuration)
   */

  // Map frontend meshDensity labels to backend fidelity keys.
  // Each level maps to a distinct grid resolution on the backend.
  const fidelityMap: Record<string, string> = {
    coarse: "low",
    medium: "medium",
    fine:   "high",
    ultra:  "ultra",
  };

  const density = config.meshDensity || "medium";
  const fidelity = fidelityMap[density];

  const res = await fetch(`${PYTHON_BACKEND_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: config.userId || auth?.currentUser?.uid,
      fidelity: fidelity,
      chord_length: config.chordLength ?? 1.0,
      sim_time: config.simulationDuration || 10,
      dt: config.timeStepSize || 0.01,
      inflow_velocity: config.velocity || 2.0,
      angle_of_attack: config.angleOfAttack || 0,
      cst_upper: config.upperCoefficients,
      cst_lower: config.lowerCoefficients,
      stream_every: 1,
      stream_fps: 30.0,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Session creation failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  console.log("Session response:", data);
  return data;
}
