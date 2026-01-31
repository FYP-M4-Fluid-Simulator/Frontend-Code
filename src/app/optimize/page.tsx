"use client";

import { useState } from "react";
import { OptimizationInput } from "../../components/OptimizationInput";
import { OptimizationAnimation } from "../../components/OptimizationAnimation";
import { OptimizationResults } from "../../components/OptimizationResults";
import { useAppContext } from "../providers";

export default function OptimizePage() {
  const { setLiftToDragRatio } = useAppContext();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleStartOptimization = () => {
    setIsOptimizing(true);
    setOptimizationComplete(false);
  };

  const handleOptimizationComplete = () => {
    setIsOptimizing(false);
    setOptimizationComplete(true);
    setLiftToDragRatio(87.3);
  };

  const handleResetOptimization = () => {
    setOptimizationComplete(false);
    setIsOptimizing(false);
  };

  return (
    <>
      {!isOptimizing && !optimizationComplete ? (
        <OptimizationInput onStartOptimization={handleStartOptimization} />
      ) : isOptimizing ? (
        <OptimizationAnimation onComplete={handleOptimizationComplete} />
      ) : (
        <OptimizationResults
          onReset={handleResetOptimization}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      )}
    </>
  );
}
