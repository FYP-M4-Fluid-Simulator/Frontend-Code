"use client";

import React from "react";
import { Plus, Minus, RotateCcw, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  className?: string;
  showFitToScreen?: boolean;
  onFitToScreen?: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset,
  className = "",
  showFitToScreen = false,
  onFitToScreen,
}) => {
  return (
    <div
      className={`absolute bottom-4 right-4 flex flex-col gap-2 z-30 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden"
      >
        <button
          onClick={onZoomIn}
          className="p-3 hover:bg-gray-100 border-b border-gray-100 transition-colors text-gray-700 hover:text-blue-600"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <div className="py-2 px-1 text-[10px] font-black text-center text-gray-500 bg-gray-50/50">
          {Math.round(zoomLevel)}%
        </div>

        <button
          onClick={onZoomOut}
          className="p-3 hover:bg-gray-100 border-t border-gray-100 transition-colors text-gray-700 hover:text-blue-600"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden"
      >
        {showFitToScreen && onFitToScreen && (
          <button
            onClick={onFitToScreen}
            className="p-3 hover:bg-gray-100 border-b border-gray-100 transition-colors text-gray-700 hover:text-blue-600"
            title="Fit to Screen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onReset}
          className="p-3 hover:bg-gray-100 transition-colors text-gray-700 hover:text-orange-600"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};
