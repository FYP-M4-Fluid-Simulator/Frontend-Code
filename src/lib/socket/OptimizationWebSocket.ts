"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createOptSession, OptSessionConfig } from "../http/createOptSession";
import { WS_BACKEND_URL } from "@/config";

// ── Types matching the server's JSON schema ──────────────────────────────────

export interface OptIterationMeta {
  iteration: number;
  total_iterations: number;
  loss: number;
  cl: number;
  cd: number;
  cl_cd: number;
  lift_force: number;
  drag_force: number;
}

export interface OptShape {
  cst_upper: number[];
  cst_lower: number[];
  airfoil_x: number[];
  airfoil_y_upper: number[];
  airfoil_y_lower: number[];
}

export interface OptIterationFrame {
  type: "iteration";
  meta: OptIterationMeta;
  shape: OptShape;
}

export interface OptCompleteFrame {
  type: "complete";
  meta: {
    total_iterations: number;
    final_cl: number;
    final_cd: number;
    final_cl_cd: number;
    final_drag: number;
    final_loss: number;
  };
  shape: OptShape;
  initial_shape: { cst_upper: number[]; cst_lower: number[] };
}

export type OptFrame = OptIterationFrame | OptCompleteFrame | { type: "warning"; message: string; iteration: number };

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useOptimization(config?: OptSessionConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Latest iteration data
  const [currentMeta, setCurrentMeta] = useState<OptIterationMeta | null>(null);
  const [currentShape, setCurrentShape] = useState<OptShape | null>(null);
  const [completedFrame, setCompletedFrame] = useState<OptCompleteFrame | null>(null);

  // History for charts: [{iteration, cl, cd, cl_cd, loss}]
  const [history, setHistory] = useState<OptIterationMeta[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const initializedConfigRef = useRef<string | null>(null);

  // Stable close helper
  const closeConnection = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("🔌 Closing optimization WebSocket");
      wsRef.current.close(1000, "Optimization stopped by user");
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!config) return;
    const configString = JSON.stringify(config);

    if (configString === initializedConfigRef.current) {
      return;
    }

    initializedConfigRef.current = configString;

    let mounted = true;

    async function start() {
      try {
        if (!WS_BACKEND_URL) {
          throw new Error("WS_BACKEND_URL is not defined. Check your .env file.");
        }

        // Reset state for a fresh run
        setIsComplete(false);
        setCurrentMeta(null);
        setCurrentShape(null);
        setCompletedFrame(null);
        setHistory([]);
        setError(null);

        // 1. Create session via HTTP
        const session = await createOptSession(config!);
        if (!mounted) return;
        setSessionId(session.session_id);

        // 2. Open WebSocket
        const wsUrl = `${WS_BACKEND_URL}/optimize/ws/${session.session_id}`;
        console.log("🔌 Connecting to optimization WebSocket:", wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ Optimization WebSocket connected");
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (e) => {
          try {
            const frame: OptFrame = JSON.parse(e.data);

            if (frame.type === "iteration") {
              setCurrentMeta(frame.meta);
              setCurrentShape(frame.shape);
              setHistory((prev) => [...prev, frame.meta]);
            } else if (frame.type === "complete") {
              setCompletedFrame(frame);
              setIsComplete(true);
              setIsConnected(false);
            } else if (frame.type === "warning") {
              console.warn(`⚠️  Iter ${frame.iteration}: ${frame.message}`);
            }
          } catch (err) {
            console.error("❌ Failed to parse optimization message:", err);
          }
        };

        ws.onerror = (event) => {
          console.error("❌ Optimization WebSocket error:", event);
          setError("WebSocket connection error");
          setIsConnected(false);
        };

        ws.onclose = (event) => {
          console.log("🔌 Optimization WebSocket closed:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          setIsConnected(false);
          wsRef.current = null;
        };
      } catch (err) {
        console.error("❌ Failed to start optimization session:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsConnected(false);
      }
    }

    start();

    return () => {
      mounted = false;
      if (wsRef.current) {
        console.log("🧹 Cleaning up optimization WebSocket");
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [config ? JSON.stringify(config) : null]);

  return {
    isConnected,
    isComplete,
    error,
    currentMeta,
    currentShape,
    completedFrame,
    history,
    closeConnection,
    sessionId,
  };
}
