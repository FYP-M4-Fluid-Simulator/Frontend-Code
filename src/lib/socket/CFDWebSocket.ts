"use client";
import { useEffect, useRef, useState } from "react";
import { createSession, SessionConfig } from "../http/createSession";
import { WS_BACKEND_URL } from "@/config";
import { auth } from "../firebase/config";

export interface XFoilData {
  cl: number | null;
  cd: number | null;
  l_d: number | null;
  status: string; // "converged" | "failed" | "error" | "not_run"
}

export function useCFD(config?: SessionConfig) {
  const frameRef = useRef<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xfoilData, setXfoilData] = useState<XFoilData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [frameStep, setFrameStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const initializedConfigRef = useRef<string | null>(null);

  console.log("WS_BACKEND_URL:", WS_BACKEND_URL);

  useEffect(() => {
    const configString = config ? JSON.stringify(config) : null;
    if (!configString || configString === initializedConfigRef.current) {
      return;
    }

    initializedConfigRef.current = configString;

    let ws: WebSocket | null = null;
    let mounted = true;

    // Reset completion state when config changes
    setIsCompleted(false);

    async function start() {
      try {
        // Check if environment variable is set
        if (!WS_BACKEND_URL) {
          throw new Error(
            "WS_BACKEND_URL is not defined. Check your .env file.",
          );
        }

        // Create session with provided config or defaults
        const sessionConfig: SessionConfig = config || {
          upperCoefficients: [0.18, 0.22, 0.2, 0.18, 0.15, 0.12],
          lowerCoefficients: [-0.1, -0.08, -0.06, -0.05, -0.04, -0.03],
        };

        const session = await createSession(sessionConfig);
        if (!mounted) return;
        setSessionId(session.session_id);

        const token = await auth.currentUser?.getIdToken();
        const tokenParam = token ? `?token=${token}` : '';

        // Create WebSocket connection
        const wsUrl = `${WS_BACKEND_URL}/ws/${session.session_id}${tokenParam}`;
        console.log("🔌 Connecting to WebSocket:", wsUrl);
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Connection opened
        ws.onopen = () => {
          console.log("✅ WebSocket connected successfully");
          setIsConnected(true);
          setIsCompleted(false);
          setError(null);
        };

        // Message received
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);

            console.log("📩 Received WebSocket message:", data);

            // Log first frame structure for debugging
            if (!frameRef.current) {
              console.log("📦 First frame structure:", {
                keys: Object.keys(data),
                sample: data,
              });
            }

            frameRef.current = data;

            // Extract progress info from meta
            if (data.meta) {
              if (typeof data.meta.step !== 'undefined') {
                setFrameStep(data.meta.step);
              }
              // total_steps is sim_time / dt — the server doesn't send it directly,
              // so we track it from config if available.
            }

            // Capture XFoil validation data from the final_results message
            if (data.type === 'final_results' && data.meta) {
              setXfoilData({
                cl: data.meta.xfoil_cl ?? null,
                cd: data.meta.xfoil_cd ?? null,
                l_d: data.meta.xfoil_l_d ?? null,
                status: data.meta.xfoil_status ?? 'not_run',
              });
            }
          } catch (err) {
            console.error("❌ Failed to parse WebSocket message:", err);
            console.error("Raw message:", e.data);
          }
        };

        // Error occurred
        ws.onerror = (event) => {
          console.error("❌ WebSocket error:", event);
          setError("WebSocket connection error");
          setIsConnected(false);
        };

        // Connection closed
        ws.onclose = (event) => {
          console.log("🔌 WebSocket closed:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          setIsConnected(false);
          if (event.wasClean) {
            setIsCompleted(true);
          }
          wsRef.current = null;

          // Don't reconnect if it was a clean close
          if (!event.wasClean && mounted) {
            console.log("🔄 Attempting to reconnect in 3 seconds...");
            setTimeout(() => {
              if (mounted) start();
            }, 3000);
          }
        };
      } catch (err) {
        console.error("❌ Failed to start CFD session:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsConnected(false);
      }
    }

    // Only start if config is provided
    if (config) {
      start();
    }

    return () => {
      mounted = false;
      if (ws) {
        console.log("🧹 Cleaning up WebSocket connection");
        ws.onclose = null; // Prevent old connection from triggering onclose!
        ws.close();
        wsRef.current = null;
      }
    };
  }, [config ? JSON.stringify(config) : null]);

  const closeConnection = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("🔌 Manually closing WebSocket connection");
      wsRef.current.onclose = null; // Prevent manual close from marking it as completed
      wsRef.current.close(1000, "Simulation completed");
      wsRef.current = null;
    }
  };

  return { frameRef, isConnected, isCompleted, setIsCompleted, error, xfoilData, closeConnection, sessionId, frameStep, totalSteps, setTotalSteps };
}
