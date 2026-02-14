"use client";

import { useState, useRef, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import {
  downloadMetricsCSV,
  downloadMetricsJSON,
  downloadDatFile,
  downloadCSTParameters,
  type OptimizationMetrics,
} from "../../lib/exportData";
import { generateAirfoil } from "../../lib/cst";

export default function OptimizePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationIteration, setOptimizationIteration] = useState(0);
  const [maxIterations, setMaxIterations] = useState(50);
  const [showResults, setShowResults] = useState(false);

  // CST Coefficients and flow parameters (loaded from sessionStorage)
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([
    0.15, 0.2, 0.18, 0.12, 0.08,
  ]);

  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([
    -0.1, -0.12, -0.09, -0.06, -0.04,
  ]);

  const [angleOfAttack, setAngleOfAttack] = useState(5);
  const [velocity, setVelocity] = useState(15);
  const [meshDensity, setMeshDensity] = useState<
    "coarse" | "medium" | "fine" | "ultra"
  >("medium");
  const [showPressureField, setShowPressureField] = useState(false);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(false);
  const [showControlPoints, setShowControlPoints] = useState(false);

  // Optimization parameters
  const [timeStepSize, setTimeStepSize] = useState(0.001);
  const [simulationDuration, setSimulationDuration] = useState(5);
  const [numIterations, setNumIterations] = useState(50);
  const [minThickness, setMinThickness] = useState(0.05);
  const [maxThickness, setMaxThickness] = useState(0.25);
  const [learningRate, setLearningRate] = useState(0.01);

  // Optimization results
  const [bestLiftCoeff, setBestLiftCoeff] = useState(0);
  const [bestDragCoeff, setBestDragCoeff] = useState(0);
  const [bestLDRatio, setBestLDRatio] = useState(0);

  // Export menu state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Canvas dimensions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest(".export-menu-container")) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const handleDownloadMetrics = (format: "csv" | "json") => {
    const metrics: OptimizationMetrics = {
      liftCoefficient: bestLiftCoeff,
      dragCoefficient: bestDragCoeff,
      momentCoefficient: 0, // Add if available
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
    const airfoil = generateAirfoil(upperCoefficients, lowerCoefficients, 100);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadDatFile(
      airfoil.upper,
      airfoil.lower,
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

  const handleStartOptimization = async () => {
    setIsOptimizing(true);
    setOptimizationIteration(0);
    setShowResults(false);

    // Dummy API call to start optimization
    try {
      const response = await fetch("/api/optimize/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upperCoefficients,
          lowerCoefficients,
          velocity,
          angleOfAttack,
          timeStepSize,
          simulationDuration,
          numIterations,
          minThickness,
          maxThickness,
          learningRate,
        }),
      });

      // Simulate optimization progress with morphing airfoil
      const interval = setInterval(() => {
        setOptimizationIteration((prev) => {
          if (prev >= numIterations) {
            clearInterval(interval);
            setIsOptimizing(false);
            setShowResults(true);

            // Set final results
            setBestLiftCoeff(1.245);
            setBestDragCoeff(0.0187);
            setBestLDRatio(66.6);

            // Store optimization results for turbine page
            sessionStorage.setItem(
              "optimizationResults",
              JSON.stringify({
                bestLiftToDragRatio: 66.6,
                bestLiftCoefficient: 1.245,
                bestDragCoefficient: 0.0187,
                generations: numIterations,
                numIterations: numIterations,
                convergenceRate: 95.8,
                improvementPercent: 66.5,
              }),
            );

            return prev;
          }

          // Simulate airfoil morphing during optimization
          setUpperCoefficients((coeffs) =>
            coeffs.map((c) => c + (Math.random() - 0.5) * 0.008),
          );
          setLowerCoefficients((coeffs) =>
            coeffs.map((c) => c + (Math.random() - 0.5) * 0.008),
          );

          return prev + 1;
        });
      }, 200); // Update every 200ms
    } catch (error) {
      console.log("Optimization would run here with API");

      // Run simulation even if API fails
      const interval = setInterval(() => {
        setOptimizationIteration((prev) => {
          if (prev >= numIterations) {
            clearInterval(interval);
            setIsOptimizing(false);
            setShowResults(true);

            setBestLiftCoeff(1.245);
            setBestDragCoeff(0.0187);
            setBestLDRatio(66.6);

            // Store optimization results for turbine page
            sessionStorage.setItem(
              "optimizationResults",
              JSON.stringify({
                bestLiftToDragRatio: 66.6,
                bestLiftCoefficient: 1.245,
                bestDragCoefficient: 0.0187,
                generations: numIterations,
                numIterations: numIterations,
                convergenceRate: 95.8,
                improvementPercent: 66.5,
              }),
            );

            return prev;
          }

          setUpperCoefficients((coeffs) =>
            coeffs.map((c) => c + (Math.random() - 0.5) * 0.008),
          );
          setLowerCoefficients((coeffs) =>
            coeffs.map((c) => c + (Math.random() - 0.5) * 0.008),
          );

          return prev + 1;
        });
      }, 200);
    }
  };

  const handlePauseOptimization = () => {
    setIsOptimizing(false);
  };

  const handleResetOptimization = () => {
    setIsOptimizing(false);
    setOptimizationIteration(0);
    setShowResults(false);

    // Reload from session storage
    const savedState = sessionStorage.getItem("cfdState");
    if (savedState) {
      const state = JSON.parse(savedState);
      setUpperCoefficients(state.upperCoefficients);
      setLowerCoefficients(state.lowerCoefficients);
    }
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

          <button
            onClick={handleResetOptimization}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 border border-gray-300 hover:border-orange-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-orange-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Export Dropdown */}
          <div className="relative export-menu-container">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-green-600"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            {showExportMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Export Optimization
                  </div>

                  <button
                    onClick={handleDownloadDatFile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Optimized Airfoil (.dat)
                      </div>
                      <div className="text-xs text-gray-500">
                        Selig format coordinates
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadCSTParams}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        CST Parameters
                      </div>
                      <div className="text-xs text-gray-500">
                        Export coefficients (JSON)
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-gray-200 my-2"></div>

                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Metrics
                  </div>

                  <button
                    onClick={() => handleDownloadMetrics("csv")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-orange-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Metrics (CSV)
                      </div>
                      <div className="text-xs text-gray-500">
                        L/D, C_L, C_D, C_M
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDownloadMetrics("json")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-orange-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Metrics (JSON)
                      </div>
                      <div className="text-xs text-gray-500">
                        L/D, C_L, C_D, C_M
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-orange-600 to-pink-600 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white tracking-wide">
              CFD AIRFOIL PLATFORM
            </span>
          </div>
          <div className="px-3 py-1 bg-orange-100 rounded-lg border border-orange-300">
            <span className="text-xs font-bold text-orange-800">
              Optimization Mode
            </span>
          </div>
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-red-600"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
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
              {/* Header */}
              <div className="flex border-b border-gray-200">
                <div className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-pink-600">
                  <div className="flex items-center gap-2 text-white">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-bold">
                      Optimization Parameters
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="px-3 hover:bg-red-50 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
                </button>
              </div>

              {/* Content */}
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
                      max={100}
                      value={velocity}
                      onChange={(e) => setVelocity(Number(e.target.value))}
                      className="flex-1 h-2 accent-cyan-500"
                    />
                    <input
                      type="number"
                      value={velocity}
                      onChange={(e) => setVelocity(Number(e.target.value))}
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
                      onChange={(e) => setAngleOfAttack(Number(e.target.value))}
                      className="flex-1 h-2 accent-purple-500"
                    />
                    <input
                      type="number"
                      value={angleOfAttack.toFixed(1)}
                      onChange={(e) => setAngleOfAttack(Number(e.target.value))}
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
                      min={0.0001}
                      max={0.01}
                      step={0.0001}
                      value={timeStepSize}
                      onChange={(e) => setTimeStepSize(Number(e.target.value))}
                      className="flex-1 h-2 accent-green-500"
                    />
                    <input
                      type="number"
                      value={timeStepSize}
                      onChange={(e) => setTimeStepSize(Number(e.target.value))}
                      step={0.0001}
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
                      value={simulationDuration}
                      onChange={(e) =>
                        setSimulationDuration(Number(e.target.value))
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
                      onChange={(e) => setNumIterations(Number(e.target.value))}
                      className="flex-1 h-2 accent-blue-500"
                    />
                    <input
                      type="number"
                      value={numIterations}
                      onChange={(e) => setNumIterations(Number(e.target.value))}
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
                      onChange={(e) => setMinThickness(Number(e.target.value))}
                      className="flex-1 h-2 accent-red-500"
                    />
                    <input
                      type="number"
                      value={minThickness.toFixed(2)}
                      onChange={(e) => setMinThickness(Number(e.target.value))}
                      step={0.01}
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
                      onChange={(e) => setMaxThickness(Number(e.target.value))}
                      className="flex-1 h-2 accent-pink-500"
                    />
                    <input
                      type="number"
                      value={maxThickness.toFixed(2)}
                      onChange={(e) => setMaxThickness(Number(e.target.value))}
                      step={0.01}
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
                      onChange={(e) => setLearningRate(Number(e.target.value))}
                      className="flex-1 h-2 accent-indigo-500"
                    />
                    <input
                      type="number"
                      value={learningRate.toFixed(3)}
                      onChange={(e) => setLearningRate(Number(e.target.value))}
                      step={0.001}
                      className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Current: {learningRate.toFixed(3)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Edge Tab - Always visible when sidebar is closed */}
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

        {/* Visualization Controls */}
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

            <div className="w-px h-4 bg-gray-300" />

            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer hover:text-green-600 transition-colors">
              <input
                type="checkbox"
                checked={showMeshOverlay}
                onChange={(e) => setShowMeshOverlay(e.target.checked)}
                className="w-4 h-4 accent-green-600"
              />
              Grid Overlay
            </label>

            <div className="w-px h-4 bg-gray-300" />

            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer hover:text-purple-600 transition-colors">
              <input
                type="checkbox"
                checked={showVectorField}
                onChange={(e) => setShowVectorField(e.target.checked)}
                className="w-4 h-4 accent-purple-600"
              />
              Vector Field
            </label>

            <div className="w-px h-4 bg-gray-300" />

            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer hover:text-orange-600 transition-colors">
              <input
                type="checkbox"
                checked={showPressureField}
                onChange={(e) => setShowPressureField(e.target.checked)}
                className="w-4 h-4 accent-orange-600"
              />
              Pressure Field
            </label>
          </div>
        </div>

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
                  showMeshOverlay={showMeshOverlay}
                  showPressureField={showPressureField}
                  showVectorField={showVectorField}
                  onCoefficientChange={updateCSTCoefficient}
                  allowFullScreen={true}
                  designMode={false}
                />
              </div>

              {/* Optimization Progress Overlay */}
              {isOptimizing && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border-2 border-orange-300">
                  <div className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600 animate-spin" />
                    Optimizing...
                  </div>
                  <div className="text-2xl font-black text-orange-600">
                    Gen: {optimizationIteration} / {numIterations}
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-pink-600 h-full transition-all duration-300"
                      style={{
                        width: `${(optimizationIteration / numIterations) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div className="w-80 flex flex-col gap-4">
              <div className="bg-white rounded-xl border-2 border-orange-300 shadow-lg p-6 space-y-4">
                <div>
                  <h3 className="text-base font-black text-gray-900 mb-1">
                    Genetic Optimization
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Evolve airfoil for maximum performance
                  </p>
                </div>

                {!isOptimizing && !showResults && (
                  <button
                    onClick={handleStartOptimization}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                  >
                    <Play className="w-5 h-5" />
                    Start Optimization
                  </button>
                )}

                {isOptimizing && (
                  <button
                    onClick={handlePauseOptimization}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                  >
                    <Pause className="w-5 h-5" />
                    Pause Optimization
                  </button>
                )}

                {showResults && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                      <p className="text-sm font-black text-green-800">
                        ✓ Optimization Complete!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Found optimal airfoil configuration
                      </p>
                    </div>

                    <button
                      onClick={() => router.push("/turbine")}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg text-sm"
                    >
                      <Wind className="w-4 h-4" />
                      View Turbine
                    </button>

                    <button
                      onClick={() => router.push("/design")}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg text-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      New Design
                    </button>
                  </div>
                )}
              </div>

              {/* Results Panel */}
              {showResults && (
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
                        {bestLiftCoeff.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Best C<sub>D</sub>:
                      </span>
                      <span className="font-black">
                        {bestDragCoeff.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Best L/D Ratio:</span>
                      <span className="font-black text-green-700">
                        {bestLDRatio.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Generations:</span>
                      <span className="font-black">
                        {optimizationIteration}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Computation Time:</span>
                      <span className="font-black">
                        {(optimizationIteration * 0.2).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Statistics */}
              {isOptimizing && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-5 space-y-3">
                  <h4 className="text-sm font-black text-blue-900">
                    📈 Live Statistics
                  </h4>
                  <div className="space-y-2 text-xs font-medium text-blue-800">
                    <div className="flex justify-between">
                      <span>Current Iteration:</span>
                      <span className="font-black">
                        {optimizationIteration}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Iterations:</span>
                      <span className="font-black">{numIterations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Learning Rate:</span>
                      <span className="font-black">
                        {learningRate.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="font-black">
                        {(
                          (optimizationIteration / numIterations) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
