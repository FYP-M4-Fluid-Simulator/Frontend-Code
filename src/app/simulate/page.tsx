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
  ChevronRight,
  BarChart3,
  FileDown,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InteractiveAirfoilCanvas } from "../../components/InteractiveAirfoilCanvas";
import CFDCanvas from "../../components/CFD_CANVAS";
import ResultsModal from "../../components/ResultsModal";
import { SessionConfig } from "../../lib/http/createSession";
import { useCFD } from "../../lib/socket/CFDWebSocket";
import { useRouter } from "next/navigation";
import {
  downloadDatFile,
  downloadCSTParameters,
  downloadConfigFile,
  createSimulationConfig,
} from "../../lib/exportData";
import { generateCSTAirfoil } from "../../lib/cst";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

export default function SimulatePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "parameters" | "results"
  >("parameters");

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | undefined>(
    undefined,
  );
  const [simulationMetrics, setSimulationMetrics] = useState({
    cl: 0,
    cd: 0,
    liftToDragRatio: 0,
  });

  // Track coefficient history for graphing
  const [coefficientHistory, setCoefficientHistory] = useState<
    Array<{
      iteration: number;
      cl: number;
      cd: number;
      ldRatio: number;
    }>
  >([]);

  // Use CFD hook when simulating
  const {
    frameRef,
    coefficients,
    isConnected,
    isCompleted,
    error: cfdError,
    closeConnection,
  } = useCFD(sessionConfig);

  // CST Coefficients and flow parameters (loaded from sessionStorage)
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([
    0.18, 0.22, 0.2, 0.18, 0.15, 0.12,
  ]);

  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([
    -0.1, -0.08, -0.06, -0.05, -0.04, -0.03,
  ]);

  const [angleOfAttack, setAngleOfAttack] = useState(0);
  const [velocity, setVelocity] = useState(15);
  const [chordLength, setChordLength] = useState(1.0);
  const [meshDensity, setMeshDensity] = useState<
    "coarse" | "medium" | "fine" | "ultra"
  >("medium"); // Default mesh density
  const [visualizationType, setVisualizationType] = useState<
    "curl" | "pressure" | "tracer"
  >("pressure");
  const [showVectorField, setShowVectorField] = useState(true);
  const [timeStepSize, setTimeStepSize] = useState(0.001);
  const [simulationDuration, setSimulationDuration] = useState(0.2);

  // Export menu state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Canvas dimensions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Ref for progress interval
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      setChordLength(state.chordLength || chordLength);
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

  const handleDownloadFullConfig = () => {
    const config = createSimulationConfig(
      upperCoefficients,
      lowerCoefficients,
      velocity,
      angleOfAttack,
      meshDensity,
    );
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    downloadConfigFile(config, `simulation-config-${timestamp}.json`);
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

  // Track coefficient history in real-time during simulation
  useEffect(() => {
    if (coefficients && isSimulating) {
      setCoefficientHistory((prev) => [
        ...prev,
        {
          iteration: prev.length + 1,
          cl: coefficients.cl,
          cd: coefficients.cd,
          ldRatio: coefficients.l_d,
        },
      ]);
    }
  }, [coefficients, isSimulating]);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setShowResults(false);
    setShowResultsModal(false); // Ensure modal is hidden at start
    setCoefficientHistory([]); // Reset coefficient history
    setIsSidebarOpen(false); // Close sidebar when simulation starts

    // Create session config for WebSocket
    const config: SessionConfig = {
      upperCoefficients,
      lowerCoefficients,
      velocity,
      angleOfAttack,
      meshDensity,
      timeStepSize,
      simulationDuration,
      runId: Date.now().toString(),
    };

    setSessionConfig(config);

    // Simulate progress animation (asymptotic)
    const progressInterval = setInterval(() => {
      setSimulationProgress((prev) => {
        if (prev >= 95) return prev;
        // Slower increment as it gets higher
        const increment = Math.max(0.1, (95 - prev) / 100);
        return prev + increment;
      });
    }, 100);
    simulationIntervalRef.current = progressInterval;
  };

  // Handle simulation completion from WebSocket
  useEffect(() => {
    if (isCompleted && isSimulating) {
      setSimulationProgress(100);
      setIsSimulating(false);

      // Update metrics with final coefficient values
      if (coefficients) {
        setSimulationMetrics({
          cl: coefficients.cl,
          cd: coefficients.cd,
          liftToDragRatio: coefficients.l_d,
        });
      }

      setShowResults(true);
      setActiveSidebarTab("results");
      setIsSidebarOpen(true);

      // Show modal after a short delay
      setTimeout(() => {
        setShowResultsModal(true);
      }, 500);

      // Store final results
      if (coefficients) {
        sessionStorage.setItem(
          "simulationResults",
          JSON.stringify({
            liftToDragRatio: coefficients.l_d,
            liftCoefficient: coefficients.cl,
            dragCoefficient: coefficients.cd,
            maxPressure: 1.45,
            computationTime: simulationDuration,
          }),
        );
      }

      // Clear interval
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }
  }, [isCompleted, isSimulating, coefficients, simulationDuration]);

  const handlePauseSimulation = () => {
    setIsSimulating(false);
  };

  const handleNavigateToOptimize = () => {
    // Save current state to sessionStorage before navigating
    sessionStorage.setItem(
      "cfdState",
      JSON.stringify({
        upperCoefficients,
        lowerCoefficients,
        angleOfAttack,
        velocity,
        meshDensity,
      }),
    );
    router.push("/optimize");
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Compact Top Ribbon */}
      <div className="bg-white border-b border-gray-300 flex items-center justify-between px-4 py-2 shadow-sm z-40">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/design")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-all text-xs font-semibold text-gray-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Design
          </button>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">
            <Wind className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white tracking-wide">
               Simulation Mode
            </span>
          </div>
          
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2">
          <UserProfileDropdown />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-50">
        {/* Left Sidebar - Simulation Parameters */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-96 shadow-2xl border-r-2 border-blue-400 z-30 flex flex-col bg-white"
            >
              {/* Tab Header */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveSidebarTab("parameters")}
                  className={`flex-1 px-4 py-3 text-sm font-bold transition-all ${
                    activeSidebarTab === "parameters"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
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
                    className={`flex-1 px-4 py-3 text-sm font-bold transition-all ${
                      activeSidebarTab === "results"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
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
                          onChange={(e) =>
                            setAngleOfAttack(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-purple-500"
                        />
                        <input
                          type="number"
                          value={angleOfAttack.toFixed(1)}
                          onChange={(e) =>
                            setAngleOfAttack(Number(e.target.value))
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
                        Time Step Size (s)
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={0.0001}
                          max={0.01}
                          step={0.0001}
                          value={timeStepSize}
                          onChange={(e) =>
                            setTimeStepSize(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-green-500"
                        />
                        <input
                          type="number"
                          value={timeStepSize}
                          onChange={(e) =>
                            setTimeStepSize(Number(e.target.value))
                          }
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
                        Simulation Duration (s)
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
                  </div>

                  {/* Start Simulation Button at bottom of Parameters tab */}
                  <div className="p-6 pt-0 border-t border-gray-200 mt-auto">
                    {!isSimulating && !showResults && (
                      <button
                        onClick={handleRunSimulation}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                      >
                        <Play className="w-5 h-5" />
                        Run Simulation
                      </button>
                    )}
                    {showResults && (
                      <button
                        onClick={handleRunSimulation}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                      >
                        <Play className="w-5 h-5" />
                        Rerun Simulation
                      </button>
                    )}
                    {isSimulating && (
                      <div className="space-y-3">
                        <button
                          onClick={handlePauseSimulation}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                        >
                          <Pause className="w-5 h-5" />
                          Pause Simulation
                        </button>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-gray-700">
                            <span>Progress</span>
                            <span>{simulationProgress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${simulationProgress}%` }}
                            />
                          </div>
                        </div>
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
                      ✓ Simulation Complete!
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 p-5 space-y-4">
                    <h4 className="text-sm font-black text-cyan-900">
                      📊 Simulation Results
                    </h4>

                    {/* Key Metrics */}
                    <div className="space-y-2 text-xs font-medium text-cyan-800">
                      <div className="flex justify-between">
                        <span>
                          Lift Coefficient (C<sub>L</sub>):
                        </span>
                        <span className="font-black">
                          {simulationMetrics.cl.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          Drag Coefficient (C<sub>D</sub>):
                        </span>
                        <span className="font-black">
                          {simulationMetrics.cd.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>L/D Ratio:</span>
                        <span className="font-black">
                          {simulationMetrics.liftToDragRatio.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Coefficient Graphs */}
                    <div className="space-y-3 pt-2 border-t border-cyan-200">
                      <h5 className="text-xs font-black text-cyan-900">
                        Coefficient Analysis
                      </h5>

                      {/* Lift Coefficient Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-cyan-700">
                            C<sub>L</sub>
                          </span>
                          <span className="font-black text-cyan-900">
                            {simulationMetrics.cl.toFixed(4)}
                          </span>
                        </div>
                        <div className="w-full bg-cyan-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                            style={{
                              width: `${Math.min((Math.abs(simulationMetrics.cl) / 1.2) * 100, 100)}%`,
                            }}
                          >
                            <span className="text-[10px] font-bold text-white">
                              Lift
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Drag Coefficient Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-cyan-700">
                            C<sub>D</sub>
                          </span>
                          <span className="font-black text-cyan-900">
                            {simulationMetrics.cd.toFixed(4)}
                          </span>
                        </div>
                        <div className="w-full bg-red-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full flex items-center justify-end pr-2"
                            style={{
                              width: `${Math.min((simulationMetrics.cd / 0.1) * 100, 100)}%`,
                            }}
                          >
                            <span className="text-[10px] font-bold text-white">
                              Drag
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* L/D Ratio Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-cyan-700">
                            L/D Ratio
                          </span>
                          <span className="font-black text-cyan-900">
                            {simulationMetrics.liftToDragRatio.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-green-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-end pr-2"
                            style={{
                              width: `${Math.min((simulationMetrics.liftToDragRatio / 50) * 100, 100)}%`,
                            }}
                          >
                            <span className="text-[10px] font-bold text-white">
                              Efficiency
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="space-y-2 pt-2 border-t border-cyan-200 text-xs font-medium text-cyan-800">
                      <div className="flex justify-between">
                        <span>Max Pressure:</span>
                        <span className="font-black">1.45 atm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Computation Time:</span>
                        <span className="font-black">2.1s</span>
                      </div>
                    </div>

                    {/* View Full Results Button */}
                    <button
                      onClick={() => setShowResultsModal(true)}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-md text-sm"
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
                      onClick={handleNavigateToOptimize}
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                    >
                      <Sparkles className="w-5 h-5" />
                      Start Optimization
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
            <div className="bg-white border-y border-r border-gray-200 shadow-sm rounded-r-xl py-8 px-1 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-200 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>

            {/* Subtle indicator line that runs the full height of the screen on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        )}

        {/* Visualization Controls - Only show after simulation starts */}
        {(isSimulating || showResults) && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border-2 border-gray-200">
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

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700">
                  Visualize Velocity:
                </label>
                <select
                  value={visualizationType}
                  onChange={(e) =>
                    setVisualizationType(
                      e.target.value as "curl" | "pressure" | "tracer",
                    )
                  }
                  className="px-3 py-1 text-xs font-semibold border border-gray-300 rounded bg-white hover:border-orange-400 transition-colors"
                >
                  <option value="curl">Curl</option>
                  <option value="pressure">Pressure</option>
                  <option value="tracer">Tracer (Density)</option>
                </select>
              </div>
            </div>
          </div>
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
                {isSimulating || showResults ? (
                  <CFDCanvas frameRef={frameRef} />
                ) : (
                  <InteractiveAirfoilCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    upperCoefficients={upperCoefficients}
                    lowerCoefficients={lowerCoefficients}
                    angleOfAttack={angleOfAttack}
                    velocity={velocity}
                    meshQuality={meshDensity}
                    showPressureField={false}
                    showVectorField={true}
                    onCoefficientChange={updateCSTCoefficient}
                    showControlPoints={false}
                    showMeshOverlay={false}
                    designMode={false}
                    chordLength={chordLength}
                  />
                )}
              </div>
            </div>

            {/* Right panel removed - canvas now takes full width */}
          </div>
        </div>
      </div>

      {/* Results Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        type="simulation"
        metrics={simulationMetrics}
        convergenceData={coefficientHistory}
      />
    </div>
  );
}
