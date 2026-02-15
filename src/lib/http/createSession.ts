import { PYTHON_BACKEND_URL } from "@/config";

export interface SessionConfig {
    upperCoefficients: number[];
    lowerCoefficients: number[];
    velocity?: number;
    angleOfAttack?: number;
    meshDensity?: "coarse" | "medium" | "fine" | "ultra";
    timeStepSize?: number;
    simulationDuration?: number;
}

export async function createSession(config: SessionConfig) {
    /**
     * This function sends a POST request to the 
     * Python FASTAPI backend to start a websocket session
  
     * params:
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

    // Map mesh density to fidelity
    const fidelityMap: Record<string, string> = {
        coarse: "low",
        medium: "medium",
        fine: "coarse",
        ultra: "coarse",
    };

    const fidelity = fidelityMap[config.meshDensity || "medium"];

    const res = await fetch(`${PYTHON_BACKEND_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fidelity,
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
