"use client";
import { useEffect, useRef } from "react";
import { useCFD } from "@/lib/socket/CFDWebSocket";
import { frame } from "framer-motion";
import { SessionConfig } from "@/lib/http/createSession";

const W = 256;
const H = 128;
const CELL = 4;

interface CFDCanvasProps {
    config?: SessionConfig;
}

export default function CFDCanvas({ config }: CFDCanvasProps = {}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { frameRef, isConnected, error } = useCFD(config);
    console.log("frameref is :", frameRef);

    useEffect(() => {
        const ctx = canvasRef.current!.getContext("2d")!;

        function loop() {
            requestAnimationFrame(loop);

            const frame = frameRef.current;
            if (!frame) return;

            // Check if frame has the expected structure
            if (!frame.fields) {
                console.warn("⚠️ Frame data structure:", frame);
                console.error("❌ Expected frame.fields but got:", Object.keys(frame));
                return;
            }

            const { u, v, curl, solid } = frame.fields;

            // Additional validation
            if (!curl || !solid) {
                console.error("❌ Missing curl or solid fields:", {
                    curl: !!curl,
                    solid: !!solid,
                });
                return;
            }
            console.log("U: ", u);
            console.log("V : ", v);



            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, W * CELL, H * CELL);

            for (let i = 0; i < H; i++) {
                for (let j = 0; j < W; j++) {
                    if (solid[i][j]) ctx.fillStyle = "gray";
                    else {
                        const c = curl[i][j];
                        const r = Math.max(0, Math.min(255, c * 5));
                        const b = Math.max(0, Math.min(255, -c * 5));
                        ctx.fillStyle = `rgb(${r},0,${b})`;
                    }
                    ctx.fillRect(j * CELL, i * CELL, CELL, CELL);
                }
            }
        }

        loop();
    }, [frameRef]);

    return (
        <div className="w-full h-full">
            <canvas ref={canvasRef} width={W * CELL} height={H * CELL} className="w-full h-full" />
        </div>
    );
}
