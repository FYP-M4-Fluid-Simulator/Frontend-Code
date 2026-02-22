"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Wind,
  Settings,
  LogOut,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  X,
  TrendingUp,
  ChevronRight,
  BarChart3,
  FileDown,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InteractiveAirfoilCanvas } from "../../components/InteractiveAirfoilCanvas";
import ResultsModal from "../../components/ResultsModal";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  downloadMetricsCSV,
  downloadMetricsJSON,
  downloadDatFile,
  downloadCSTParameters,
  saveExperimentToBackend,
  type OptimizationMetrics,
} from "../../lib/exportData";
import { generateCSTAirfoil } from "../../lib/cst";
import { useOptimization } from "../../lib/socket/OptimizationWebSocket";
import type { OptSessionConfig } from "../../lib/http/createOptSession";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { auth } from "@/lib/firebase/config";
import { toast } from "sonner";

export default function OptimizePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "parameters" | "results"
  >("parameters");

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationIteration, setOptimizationIteration] = useState(0);
  const [maxIterations, setMaxIterations] = useState(50);
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [isExperimentSaved, setIsExperimentSaved] = useState(false);
  const [isSavingExperiment, setIsSavingExperiment] = useState(false);
  const [optimizationMetrics, setOptimizationMetrics] = useState({
    cl: 1.2345,
    cd: 0.0156,
    liftToDragRatio: 79.2,
    loss: 0.000456,
  });

  // CST Coefficients and flow parameters (loaded from sessionStorage)
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([
    0.18, 0.22, 0.2, 0.18, 0.15, 0.12,
  ]);

  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([
    -0.1, -0.08, -0.06, -0.05, -0.04, -0.03,
  ]);

  const [angleOfAttack, setAngleOfAttack] = useState(0);
  const [velocity, setVelocity] = useState(1);
  const [meshDensity, setMeshDensity] = useState<
    "coarse" | "medium" | "fine" | "ultra"
  >("coarse");
  const [showControlPoints, setShowControlPoints] = useState(false);

  // L/D ratio tracking for live chart
  const [ldRatioHistory, setLdRatioHistory] = useState<
    Array<{ iteration: number; ldRatio: number }>
  >([]);

  // Optimization parameters
  const [timeStepSize, setTimeStepSize] = useState(0.001);
  const [simulationDuration, setSimulationDuration] = useState(5);
  const [numIterations, setNumIterations] = useState(30);
  const [minThickness, setMinThickness] = useState(0.06);
  const [maxThickness, setMaxThickness] = useState(0.25);
  const [learningRate, setLearningRate] = useState(0.005);

  // Optimization results
  const [bestLiftCoeff, setBestLiftCoeff] = useState(0);
  const [bestDragCoeff, setBestDragCoeff] = useState(0);
  const [bestLDRatio, setBestLDRatio] = useState(0);
  const [optimizationLoss, setOptimizationLoss] = useState(0);

  // Export menu state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Canvas dimensions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Optimization interval ref for cleanup
  const optimizationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Optimization session config — setting this triggers the hook
  const [optSessionConfig, setOptSessionConfig] = useState<
    OptSessionConfig | undefined
  >(undefined);

  // Real optimization hook
  const {
    isConnected: optConnected,
    isComplete: optComplete,
    error: optError,
    currentMeta,
    currentShape,
    completedFrame,
    history: optHistory,
    closeConnection: closeOptConnection,
    sessionId: optSessionId,
  } = useOptimization(optSessionConfig);

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem("cfdState");
    if (savedState) {
      const state = JSON.parse(savedState);
      setUpperCoefficients(state.upperCoefficients || upperCoefficients);
      setLowerCoefficients(state.lowerCoefficients || lowerCoefficients);
      setAngleOfAttack(state.angleOfAttack || angleOfAttack);
      setVelocity(state.velocity || velocity);
      setMeshDensity(state.meshDensity || meshDensity);
    }
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isSidebarOpen]); // Add dependency on sidebar state to trigger resize

  // Update shape + metrics on every iteration
  useEffect(() => {
    if (!currentMeta || !currentShape) return;

    // Update live CST coefficients so the canvas re-renders the new shape
    setUpperCoefficients(currentShape.cst_upper);
    setLowerCoefficients(currentShape.cst_lower);

    // Update live metrics display
    setOptimizationIteration(currentMeta.iteration);
    setMaxIterations(currentMeta.total_iterations);

    // Append to L/D chart
    setLdRatioHistory((prev) => [
      ...prev,
      { iteration: currentMeta.iteration, ldRatio: currentMeta.cl_cd },
    ]);

    // Keep running best values updated
    setBestLiftCoeff(currentMeta.cl);
    setBestDragCoeff(currentMeta.cd);
    setBestLDRatio(currentMeta.cl_cd);
    setOptimizationLoss(currentMeta.loss);
  }, [currentMeta, currentShape]);

  // Handle optimization completion
  useEffect(() => {
    if (!optComplete || !completedFrame) return;

    const { meta, shape } = completedFrame;

    // Final shape
    setUpperCoefficients(shape.cst_upper);
    setLowerCoefficients(shape.cst_lower);

    // Final metrics
    const finalMetrics = {
      cl: meta.final_cl,
      cd: meta.final_cd,
      liftToDragRatio: meta.final_cl_cd,
      loss: meta.final_loss,
    };
    setOptimizationMetrics(finalMetrics);
    setBestLiftCoeff(meta.final_cl);
    setBestDragCoeff(meta.final_cd);
    setBestLDRatio(meta.final_cl_cd);

    setIsOptimizing(false);
    setShowResults(true);
    setActiveSidebarTab("results");
    setIsSidebarOpen(true);

    // Store for turbine page
    sessionStorage.setItem(
      "optimizationResults",
      JSON.stringify({
        bestLiftToDragRatio: meta.final_cl_cd,
        bestLiftCoefficient: meta.final_cl,
        bestDragCoefficient: meta.final_cd,
        generations: meta.total_iterations,
        numIterations: meta.total_iterations,
        convergenceRate: 100,
        improvementPercent: 0,
      }),
    );

    setTimeout(() => setShowResultsModal(true), 500);
  }, [optComplete, completedFrame]);

  // Surface errors
  useEffect(() => {
    if (optError) {
      console.error("Optimization error:", optError);
      setIsOptimizing(false);
    }
  }, [optError]);

  const handleDownloadMetrics = (format: "csv" | "json") => {
    const metrics: OptimizationMetrics = {
      liftCoefficient: bestLiftCoeff,
      dragCoefficient: bestDragCoeff,
      liftToDragRatio: bestLDRatio,
      angleOfAttack: angleOfAttack,
      velocity: velocity,
      reynoldsNumber: velocity * 10000,
    };

    const timestamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      downloadMetricsCSV(metrics, `optimization-metrics-${timestamp}.csv`);
    } else {
      downloadMetricsJSON(metrics, `optimization-metrics-${timestamp}.json`);
    }
    setShowExportMenu(false);
  };

  const handleDownloadDatFile = () => {
    const airfoil = generateCSTAirfoil(
      upperCoefficients,
      lowerCoefficients,
      0,
      100,
    );
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadDatFile(
      airfoil.upperCoordinates,
      airfoil.lowerCoordinates,
      `optimized-airfoil-${timestamp}`,
    );
    setShowExportMenu(false);
  };

  const handleDownloadCSTParams = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCSTParameters(
      upperCoefficients,
      lowerCoefficients,
      `optimized-cst-params-${timestamp}.json`,
    );
    setShowExportMenu(false);
  };

  const handleSaveExperiment = async (name: string) => {
    const activeSessionId = optSessionId || optSessionConfig?.runId;
    if (!activeSessionId) {
      toast.error("No active session to save.");
      return;
    }

    try {
      setIsSavingExperiment(true);
      // Backend URL - can be moved to env variable
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const response = await fetch(`${backendUrl}/save_experiment/${activeSessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          user_id: auth?.currentUser?.uid || "anonymous",
          is_optimized: true
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save experiment");
      }

      setIsExperimentSaved(true);
      toast.success("Experiment saved successfully!");
    } catch (error) {
      console.error("Failed to save experiment:", error);
      toast.error("Failed to save experiment. Please try again.");
    } finally {
      setIsSavingExperiment(false);
    }
  };

  const handleModalDownloadMetrics = (format: "csv" | "json") => {
    const metrics: OptimizationMetrics = {
      liftCoefficient: optimizationMetrics.cl,
      dragCoefficient: optimizationMetrics.cd,
      liftToDragRatio:
        optimizationMetrics.liftToDragRatio ||
        optimizationMetrics.cl / optimizationMetrics.cd,
      angleOfAttack: angleOfAttack,
      velocity: velocity,
      reynoldsNumber: velocity * 10000,
    };

    const timestamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      downloadMetricsCSV(metrics, `optimization-metrics-${timestamp}.csv`);
    } else {
      downloadMetricsJSON(metrics, `optimization-metrics-${timestamp}.json`);
    }
  };

  const updateCSTCoefficient = (
    surface: "upper" | "lower",
    index: number,
    value: number,
  ) => {
    if (surface === "upper") {
      const newCoeffs = [...upperCoefficients];
      newCoeffs[index] = value;
      setUpperCoefficients(newCoeffs);
    } else {
      const newCoeffs = [...lowerCoefficients];
      newCoeffs[index] = value;
      setLowerCoefficients(newCoeffs);
    }
  };

  const handleStartOptimization = () => {
    // Clear any stale interval
    if (optimizationIntervalRef.current) {
      clearInterval(optimizationIntervalRef.current);
      optimizationIntervalRef.current = null;
    }

    setIsOptimizing(true);
    setOptimizationIteration(0);
    setShowResults(false);
    setShowResultsModal(false);
    setIsExperimentSaved(false);
    setLdRatioHistory([]);
    setIsSidebarOpen(false);

    // Reset metrics
    setOptimizationMetrics({
      cl: 0,
      cd: 0,
      liftToDragRatio: 0,
      loss: 0,
    });
    setBestLiftCoeff(0);
    setBestDragCoeff(0);
    setBestLDRatio(0);
    setOptimizationLoss(0);

    // Trigger the hook by setting a new config object
    setOptSessionConfig({
      upperCoefficients,
      lowerCoefficients,
      numIterations,
      learningRate,
      numSimSteps: 80,
      minThickness,
      maxThickness,
      inflow_velocity: velocity,
      angle_of_attack: angleOfAttack,
      meshDensity,
      runId: Date.now().toString(),
    });
  };

  const handleStopOptimization = () => {
    // Clear the interval
    if (optimizationIntervalRef.current) {
      clearInterval(optimizationIntervalRef.current);
      optimizationIntervalRef.current = null;
    }

    closeOptConnection();

    setIsOptimizing(false);
    setOptimizationIteration(0);
    setShowResults(false);
    setLdRatioHistory([]);
    setOptSessionConfig(undefined);

    // Reload initial coefficients from session storage
    const savedState = sessionStorage.getItem("cfdState");
    if (savedState) {
      const state = JSON.parse(savedState);
      setUpperCoefficients(state.upperCoefficients || upperCoefficients);
      setLowerCoefficients(state.lowerCoefficients || lowerCoefficients);
    }
  };

  const formatValue = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "0.0000";
    if (val === 0) return "0.0000";

    // Use scientific notation for small values
    if (Math.abs(val) < 0.001 && Math.abs(val) > 0) {
      const parts = val.toExponential(2).split("e");
      return (
        <span>
          {parts[0]} &times; 10<sup>{parts[1].replace("+", "")}</sup>
        </span>
      );
    }
    return val.toFixed(4);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Compact Top Ribbon */}
      <div className="bg-white border-b border-gray-300 flex items-center justify-between px-4 py-2 shadow-sm z-40">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/simulate")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-all text-xs font-semibold text-gray-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Simulation
          </button>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-orange-600 to-pink-600 rounded-lg">
            {/* <Sparkles className="w-4 h-4 text-white" /> */}
            <span className="text-xs font-black text-white tracking-wide">
              CFD AIRFOIL PLATFORM
            </span>
          </div>
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2">
          <UserProfileDropdown />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative bg-gradient-to-br from-gray-50 via-white to-orange-50">
        {/* Left Sidebar - Optimization Parameters */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-96 shadow-2xl border-r-2 border-orange-400 z-30 flex flex-col bg-white"
            >
              {/* Tab Header */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveSidebarTab("parameters")}
                  className={`flex-1 px-4 py-3 text-sm font-bold transition-all ${activeSidebarTab === "parameters"
                    ? "bg-gradient-to-r from-orange-600 to-pink-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Parameters</span>
                  </div>
                </button>
                {showResults && (
                  <button
                    onClick={() => setActiveSidebarTab("results")}
                    className={`flex-1 px-4 py-3 text-sm font-bold transition-all ${activeSidebarTab === "results"
                      ? "bg-gradient-to-r from-orange-600 to-pink-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Results</span>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="px-3 hover:bg-red-50 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
                </button>
              </div>

              {/* Parameters Tab Content */}
              {activeSidebarTab === "parameters" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Grid Granularity
                      </label>
                      <select
                        value={meshDensity}
                        onChange={(e) => setMeshDensity(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                      >
                        <option value="coarse">Coarse (Fast)</option>
                        <option value="medium">Medium (Balanced)</option>
                        <option value="fine">Fine (Detailed)</option>
                        <option value="ultra">Ultra (Precise)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Inflow Velocity (m/s)
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={5}
                          max={30}
                          value={velocity}
                          onChange={(e) => setVelocity(Number(e.target.value))}
                          className="flex-1 h-2 accent-cyan-500"
                        />
                        <input
                          type="number"
                          min={5}
                          max={30}
                          value={velocity}
                          onChange={(e) => setVelocity(Number(e.target.value))}
                          onBlur={(e) => setVelocity(Math.min(30, Math.max(5, Number(e.target.value))))}
                          className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {velocity} m/s
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Angle of Attack (°)
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={-15}
                          max={25}
                          step={0.5}
                          value={angleOfAttack}
                          onChange={(e) =>
                            setAngleOfAttack(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-purple-500"
                        />
                        <input
                          type="number"
                          min={-15}
                          max={25}
                          step={0.5}
                          value={angleOfAttack.toFixed(1)}
                          onChange={(e) =>
                            setAngleOfAttack(Number(e.target.value))
                          }
                          onBlur={(e) =>
                            setAngleOfAttack(Math.min(25, Math.max(-15, Number(e.target.value))))
                          }
                          className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {angleOfAttack.toFixed(1)}°
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Time Step Size (s)
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={0}
                          max={0.005}
                          step={0.001}
                          value={timeStepSize}
                          onChange={(e) =>
                            setTimeStepSize(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-green-500"
                        />
                        <input
                          type="number"
                          min={0}
                          max={0.005}
                          step={0.001}
                          value={timeStepSize}
                          onChange={(e) =>
                            setTimeStepSize(Number(e.target.value))
                          }
                          onBlur={(e) =>
                            setTimeStepSize(Math.min(0.005, Math.max(0, Number(e.target.value))))
                          }
                          className="w-24 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {timeStepSize.toFixed(4)} s
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Time Duration of Simulation (s)
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={1}
                          max={60}
                          step={1}
                          value={simulationDuration}
                          onChange={(e) =>
                            setSimulationDuration(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-orange-500"
                        />
                        <input
                          type="number"
                          min={1}
                          max={60}
                          step={1}
                          value={simulationDuration}
                          onChange={(e) =>
                            setSimulationDuration(Number(e.target.value))
                          }
                          onBlur={(e) =>
                            setSimulationDuration(Math.min(60, Math.max(1, Number(e.target.value))))
                          }
                          className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {simulationDuration} s
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Num Iterations
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={10}
                          max={200}
                          step={10}
                          value={numIterations}
                          onChange={(e) =>
                            setNumIterations(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-blue-500"
                        />
                        <input
                          type="number"
                          min={10}
                          max={200}
                          step={10}
                          value={numIterations}
                          onChange={(e) =>
                            setNumIterations(Number(e.target.value))
                          }
                          onBlur={(e) =>
                            setNumIterations(Math.min(200, Math.max(10, Number(e.target.value))))
                          }
                          className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Iterations: {numIterations}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Min Thickness
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={0.01}
                          max={0.15}
                          step={0.01}
                          value={minThickness}
                          onChange={(e) =>
                            setMinThickness(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-red-500"
                        />
                        <input
                          type="number"
                          min={0.01}
                          max={0.15}
                          step={0.01}
                          value={minThickness.toFixed(2)}
                          onChange={(e) =>
                            setMinThickness(Number(e.target.value))
                          }
                          onBlur={(e) =>
                            setMinThickness(Math.min(0.15, Math.max(0.01, Number(e.target.value))))
                          }
                          className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {minThickness.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Max Thickness
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={0.15}
                          max={0.35}
                          step={0.01}
                          value={maxThickness}
                          onChange={(e) =>
                            setMaxThickness(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-pink-500"
                        />
                        <input
                          type="number"
                          min={0.15}
                          max={0.35}
                          step={0.01}
                          value={maxThickness.toFixed(2)}
                          onChange={(e) =>
                            setMaxThickness(Number(e.target.value))
                          }
                          onBlur={(e) =>
                            setMaxThickness(Math.min(0.35, Math.max(0.15, Number(e.target.value))))
                          }
                          className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {maxThickness.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Learning Rate
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={0.001}
                          max={0.1}
                          step={0.001}
                          value={learningRate}
                          onChange={(e) =>
                            setLearningRate(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-indigo-500"
                        />
                        <input
                          type="number"
                          min={0.001}
                          max={0.1}
                          step={0.001}
                          value={learningRate.toFixed(3)}
                          onChange={(e) =>
                            setLearningRate(Number(e.target.value))
                          }
                          onBlur={(e) =>
                            setLearningRate(Math.min(0.1, Math.max(0.001, Number(e.target.value))))
                          }
                          className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {learningRate.toFixed(3)}
                      </p>
                    </div>
                  </div>

                  {/* Start Optimization Button at bottom */}
                  <div className="p-6 pt-0 border-t border-gray-200 mt-auto">
                    {!isOptimizing && !showResults && (
                      <button
                        onClick={handleStartOptimization}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                      >
                        <Play className="w-5 h-5" />
                        Start Optimization
                      </button>
                    )}
                    {showResults && (
                      <button
                        onClick={handleStartOptimization}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                      >
                        <Play className="w-5 h-5" />
                        Rerun Optimization
                      </button>
                    )}
                    {isOptimizing && (
                      <div className="space-y-3">
                        <button
                          onClick={handleStopOptimization}
                          className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                        >
                          <X className="w-5 h-5" />
                          Stop Optimization
                        </button>
                        <button
                          onClick={handleStartOptimization}
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg text-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restart Optimization
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results Tab Content */}
              {activeSidebarTab === "results" && showResults && (
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                    <p className="text-sm font-black text-green-800">
                      ✓ Optimization Complete!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Found optimal airfoil configuration
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl border-2 border-orange-200 p-5 space-y-3">
                    <h4 className="text-sm font-black text-orange-900">
                      🏆 Optimization Results
                    </h4>
                    <div className="space-y-2 text-xs font-medium text-orange-800">
                      <div className="flex justify-between">
                        <span>
                          Best C<sub>L</sub>:
                        </span>
                        <span className="font-black">
                          {formatValue(optimizationMetrics.cl)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          Best C<sub>D</sub>:
                        </span>
                        <span className="font-black">
                          {formatValue(optimizationMetrics.cd)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best L/D Ratio:</span>
                        <span className="font-black text-green-700">
                          {optimizationMetrics.liftToDragRatio?.toFixed(2) ||
                            (
                              optimizationMetrics.cl / optimizationMetrics.cd
                            ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Final Loss:</span>
                        <span className="font-black">
                          {formatValue(optimizationMetrics.loss)}
                        </span>
                      </div>
                    </div>

                    {/* L/D Ratio Progress Chart */}
                    {ldRatioHistory.length > 0 && (
                      <div className="pt-3 border-t border-orange-200">
                        <h5 className="text-xs font-black text-orange-900 mb-2">
                          L/D Ratio Evolution
                        </h5>
                        <ResponsiveContainer width="100%" height={100}>
                          <LineChart data={ldRatioHistory}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#fed7aa"
                            />
                            <XAxis
                              dataKey="iteration"
                              tick={{ fontSize: 10 }}
                              stroke="#f97316"
                            />
                            <YAxis tick={{ fontSize: 10 }} stroke="#f97316" />
                            <Tooltip
                              contentStyle={{
                                fontSize: "10px",
                                backgroundColor: "#fff7ed",
                                border: "1px solid #fb923c",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="ldRatio"
                              stroke="#f97316"
                              strokeWidth={2}
                              dot={{ fill: "#f97316", r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* View Full Results Button */}
                    <button
                      onClick={() => setShowResultsModal(true)}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all shadow-md text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Full Results
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push("/turbine")}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                    >
                      <Wind className="w-5 h-5" />
                      View Turbine
                    </button>

                    <button
                      onClick={() => router.push("/design")}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                    >
                      <TrendingUp className="w-5 h-5" />
                      New Design
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Points Toggle */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border-2 border-gray-200">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
              <input
                type="checkbox"
                checked={showControlPoints}
                onChange={(e) => setShowControlPoints(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Control Points
            </label>
          </div>
        </div>

        {/* Sidebar Edge Tab - Show when sidebar is closed */}
        {!isSidebarOpen && (
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            onClick={() => setIsSidebarOpen(true)}
          >
            {/* The Visible Tab */}
            <div className="bg-white border-y border-r border-gray-200 shadow-sm rounded-r-xl py-8 px-1 group-hover:bg-orange-600 group-hover:border-orange-600 transition-all duration-200 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>

            {/* Subtle indicator line that runs the full height of the screen on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 gap-4">
          <div className="flex-1 flex gap-4">
            <div className="flex-1 relative" ref={canvasRef}>
              <div
                className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden"
                style={{
                  background: "#000000",
                  border: "2px solid rgba(100, 100, 100, 0.4)",
                }}
              >
                <InteractiveAirfoilCanvas
                  width={canvasSize.width}
                  height={canvasSize.height}
                  upperCoefficients={upperCoefficients}
                  lowerCoefficients={lowerCoefficients}
                  angleOfAttack={angleOfAttack}
                  velocity={velocity}
                  meshQuality={meshDensity}
                  showControlPoints={showControlPoints}
                  showMeshOverlay={true}
                  showPressureField={false}
                  showVectorField={true}
                  onCoefficientChange={updateCSTCoefficient}
                  designMode={false}
                />
              </div>

              {/* Optimization Progress Overlay */}
              {isOptimizing && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-2xl border-2 border-orange-300 w-64">
                  <div className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-600 animate-spin" />
                      Optimizing...
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                      Step {optimizationIteration}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-orange-600 mb-1">
                    Iter: {optimizationIteration} / {numIterations}
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-4">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-pink-600 h-full transition-all duration-300"
                      style={{
                        width: `${(optimizationIteration / numIterations) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Real-time Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                      <p className="text-[10px] font-black text-orange-800 uppercase tracking-tighter">
                        Loss
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatValue(optimizationLoss)}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <p className="text-[10px] font-black text-blue-800 uppercase tracking-tighter">
                        L/D Ratio
                      </p>
                      <p className="text-sm font-bold text-gray-900 text-green-600">
                        {bestLDRatio.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                        C<sub>L</sub>
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatValue(bestLiftCoeff)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                        C<sub>D</sub>
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatValue(bestDragCoeff)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right panel removed - canvas now takes full width */}
          </div>
        </div>
      </div>

      {/* Results Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        type="optimization"
        metrics={optimizationMetrics}
        convergenceData={optHistory.map((h) => ({
          iteration: h.iteration,
          cl: h.cl,
          cd: h.cd,
          loss: h.loss,
          ldRatio: h.cl_cd,
        }))}
        onSaveExperiment={handleSaveExperiment}
        onDownloadMetrics={handleModalDownloadMetrics}
        isSaved={isExperimentSaved}
        isSaving={isSavingExperiment}
      />
    </div>
  );
}
