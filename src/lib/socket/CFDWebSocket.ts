"use client";
import { useEffect, useRef, useState } from "react";
import { createSession } from "../http/createSession";
import { WS_BACKEND_URL } from "@/config";
// import { CFDFrame } from "@/types/cfd";

export function useCFD() {
  const frameRef = useRef<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log("WS_BACKEND_URL:", WS_BACKEND_URL);
  useEffect(() => {
    let ws: WebSocket | null = null;
    let mounted = true;

    async function start() {
      try {
        // Check if environment variable is set
        if (!WS_BACKEND_URL) {
          throw new Error(
            "WS_BACKEND_URL is not defined. Check your .env file.",
          );
        }

        // Create session
        const session = await createSession();
      

        // Only proceed if component is still mounted
        if (!mounted) return;

        // Create WebSocket connection
        const wsUrl = `${WS_BACKEND_URL}/ws/${session.session_id}`;
        console.log("🔌 Connecting to WebSocket:", wsUrl);
        ws = new WebSocket(wsUrl);

        // Connection opened
        ws.onopen = () => {
          console.log("✅ WebSocket connected successfully");
          setIsConnected(true);
          setError(null);
        };

        // Message received
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);

            // Log first frame structure for debugging
            if (!frameRef.current) {
              console.log("📦 First frame structure:", {
                keys: Object.keys(data),
                sample: data,
              });
            }

            frameRef.current = data;
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

          // Attempt to reconnect after 3 seconds if it wasn't a clean close
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
      }
    }

    start();

    // Cleanup function
    return () => {
      mounted = false;
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("🔌 Closing WebSocket...");
        ws.close();
      }
    };
  }, []);

  return { frameRef, isConnected, error };
}
