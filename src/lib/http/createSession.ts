import { PYTHON_BACKEND_URL } from "@/config";

export async function createSession() {
  /**
   * This function sends a POST request to the 
   * Python FASTAPI backend to start a websocket

   * params:
   *        - fidelity: "low" | "medium" | "high"
   *        - sim_time: number (seconds)
   *        - cst_upper: number[] (length 6)
   *        - cst_lower: number[] (length 6)
   *        - stream_every: number (stream every N steps)
   *        - stream_fps: number (frames per second to stream)
   * returns:
   *        - session_id: string (UUID for the session)
   *        - error handling: throws an error if the request fails or if the response is not ok
   * 
   * 
   */

  const res = await fetch(`${PYTHON_BACKEND_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fidelity: "medium",
      sim_time: 10,
      cst_upper: [0.18, 0.22, 0.2, 0.18, 0.15, 0.12], // Default RAE2822
      cst_lower: [-0.1, -0.08, -0.06, -0.05, -0.04, -0.03], // Default RAE2822
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
