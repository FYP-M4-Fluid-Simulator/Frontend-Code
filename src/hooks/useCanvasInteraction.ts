"use client";

import { useState, useCallback, useRef } from "react";

const MIN_ZOOM = 100;
const MAX_ZOOM = 500;

function clampOffset(
  ox: number,
  oy: number,
  scale: number,
  width: number,
  height: number
) {
  // At a given scale the content is (scale × W) × (scale × H), centred in the
  // canvas. The max translation that still keeps every grid edge inside the
  // viewport is (scale − 1) × dimension / 2.
  const maxX = (width * (scale - 1)) / 2;
  const maxY = (height * (scale - 1)) / 2;
  return {
    x: Math.max(-maxX, Math.min(maxX, ox)),
    y: Math.max(-maxY, Math.min(maxY, oy)),
  };
}

export function useCanvasInteraction(
  canvasSize: { width: number; height: number } = { width: 800, height: 600 }
) {
  const [zoomLevel, setZoomLevelState] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Keep a ref in sync so panning callbacks always read the live zoom value
  // without stale closure issues.
  const zoomRef = useRef(MIN_ZOOM);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const setZoomLevel = useCallback(
    (val: number | ((prev: number) => number)) => {
      setZoomLevelState((prev) => {
        const next = typeof val === "function" ? val(prev) : val;
        zoomRef.current = next;
        return next;
      });
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev * 1.2, MAX_ZOOM));
    // Offset stays valid — bounds only grow when zooming in.
  }, [setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.max(prev / 1.2, MIN_ZOOM);
      // Re-clamp offset to the tighter bounds of the lower zoom level.
      setOffset((prevOffset) =>
        clampOffset(
          prevOffset.x,
          prevOffset.y,
          next / 100,
          canvasSize.width,
          canvasSize.height
        )
      );
      return next;
    });
  }, [setZoomLevel, canvasSize]);

  const handleReset = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, [setZoomLevel]);

  const handleWheel = useCallback(
    (e: React.WheelEvent | WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomLevel((prev) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * factor));
        if (next < prev) {
          // Zooming out — re-clamp offset to the tighter bounds.
          setOffset((prevOffset) =>
            clampOffset(
              prevOffset.x,
              prevOffset.y,
              next / 100,
              canvasSize.width,
              canvasSize.height
            )
          );
        }
        return next;
      });
    },
    [setZoomLevel, canvasSize]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent | MouseEvent) => {
    if ((e as MouseEvent).button === 1 || (e as MouseEvent).button === 0) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!isDraggingRef.current) return;

      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;

      setOffset((prev) =>
        clampOffset(
          prev.x + dx,
          prev.y + dy,
          zoomRef.current / 100,
          canvasSize.width,
          canvasSize.height
        )
      );

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    },
    [canvasSize]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return {
    zoomLevel,
    offset,
    setZoomLevel,
    setOffset,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
