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
  FileDown,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InteractiveAirfoilCanvas } from "../../components/InteractiveAirfoilCanvas";
import ResultsModal from "../../components/ResultsModal";
import { useRouter } from "next/navigation";
import {
  downloadDatFile,
  downloadCSTParameters,
  downloadConfigFile,
  createSimulationConfig,
} from "../../lib/exportData";
import { generateAirfoil } from "../../lib/cst";

export default function SimulatePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [simulationMetrics, setSimulationMetrics] = useState({
    cl: 0.8542,
    cd: 0.0234,
    cm: -0.0456,
    liftToDragRatio: 36.5,
  });

  // CST Coefficients and flow parameters (loaded from sessionStorage)
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([
    0.15, 0.2, 0.18, 0.12, 0.08,
  ]);

  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([
    -0.1, -0.12, -0.09, -0.06, -0.04,
  ]);

  const [angleOfAttack, setAngleOfAttack] = useState(0);
  const [velocity, setVelocity] = useState(15);
  const [meshDensity, setMeshDensity] = useState<
    "coarse" | "medium" | "fine" | "ultra"
  >("medium"); // Default mesh density
  const [visualizationType, setVisualizationType] = useState<
    "curl" | "pressure" | "tracer"
  >("pressure");
  const [showVectorField, setShowVectorField] = useState(true);
  const [timeStepSize, setTimeStepSize] = useState(0.001);
  const [simulationDuration, setSimulationDuration] = useState(5);

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

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setShowResults(false);

    // Simulate progress (dummy API call)
    try {
      const response = await fetch("/api/simulate/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upperCoefficients,
          lowerCoefficients,
          velocity,
          angleOfAttack,
          meshDensity,
        }),
      });

      // Simulate progress animation
      for (let i = 0; i <= 100; i += 5) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setSimulationProgress(i);
      }

      const metrics = {
        cl: 0.8542,
        cd: 0.0234,
        cm: -0.0456,
        liftToDragRatio: 36.5,
      };
      setSimulationMetrics(metrics);
      setShowResults(true);
      setShowResultsModal(true);
      // Store simulation results for turbine page
      sessionStorage.setItem(
        "simulationResults",
        JSON.stringify({
          liftToDragRatio: 36.5,
          liftCoefficient: 0.8542,
          dragCoefficient: 0.0234,
          maxPressure: 1.45,
          computationTime: 2.1,
        }),
      );
    } catch (error) {
      console.log("Simulation would run here with API");
      // Simulate progress even if API fails
      for (let i = 0; i <= 100; i += 5) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setSimulationProgress(i);
      }
      const metrics = {
        cl: 0.8542,
        cd: 0.0234,
        cm: -0.0456,
        liftToDragRatio: 36.5,
      };
      setSimulationMetrics(metrics);
      setShowResults(true);
      setShowResultsModal(true);
      // Store simulation results for turbine page
      sessionStorage.setItem(
        "simulationResults",
        JSON.stringify({
          liftToDragRatio: 36.5,
          liftCoefficient: 0.8542,
          dragCoefficient: 0.0234,
          maxPressure: 1.45,
          computationTime: 2.1,
        }),
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePauseSimulation = () => {
    setIsSimulating(false);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulationProgress(0);
    setShowResults(false);
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

          <button
            onClick={handleResetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-gray-300 hover:border-blue-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-blue-600"
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
                    Export Simulation
                  </div>

                  <button
                    onClick={handleDownloadFullConfig}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <FileText className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Full JSON Config
                      </div>
                      <div className="text-xs text-gray-500">
                        Complete simulation data
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadDatFile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Optimized Shape (.dat)
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">
            <Wind className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white tracking-wide">
              CFD AIRFOIL PLATFORM
            </span>
          </div>
          <div className="px-3 py-1 bg-cyan-100 rounded-lg border border-cyan-300">
            <span className="text-xs font-bold text-cyan-800">
              Simulation Mode
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
              {/* Header */}
              <div className="flex border-b border-gray-200">
                <div className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600">
                  <div className="flex items-center gap-2 text-white">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-bold">
                      Simulation Parameters
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
            <div className="bg-white border-y border-r border-gray-200 shadow-sm rounded-r-xl py-8 px-1 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-200 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>

            {/* Subtle indicator line that runs the full height of the screen on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        )}

        {/* Visualization Controls */}
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
                Visualize:
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
                  showPressureField={visualizationType === "pressure"}
                  showVectorField={showVectorField}
                  onCoefficientChange={updateCSTCoefficient}
                  showControlPoints={false}
                  showMeshOverlay={false}
                  allowFullScreen={true}
                  designMode={false}
                />
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-80 flex flex-col gap-4">
              <div className="bg-white rounded-xl border-2 border-cyan-300 shadow-lg p-6 space-y-4">
                <div>
                  <h3 className="text-base font-black text-gray-900 mb-1">
                    CFD Simulation
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Run computational fluid dynamics analysis
                  </p>
                </div>

                {!isSimulating && !showResults && (
                  <button
                    onClick={handleRunSimulation}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base"
                  >
                    <Play className="w-5 h-5" />
                    Run Simulation
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
                        <span>{simulationProgress}%</span>
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

                {showResults && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                      <p className="text-sm font-black text-green-800">
                        ✓ Simulation Complete!
                      </p>
                    </div>

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
                )}
              </div>

              {/* Results Panel */}
              {showResults && (
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 p-5 space-y-4 overflow-y-auto">
                  <h4 className="text-sm font-black text-cyan-900">
                    📊 Simulation Results
                  </h4>

                  {/* Key Metrics */}
                  <div className="space-y-2 text-xs font-medium text-cyan-800">
                    <div className="flex justify-between">
                      <span>
                        Lift Coefficient (C<sub>L</sub>):
                      </span>
                      <span className="font-black">0.8542</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Drag Coefficient (C<sub>D</sub>):
                      </span>
                      <span className="font-black">0.0234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>L/D Ratio:</span>
                      <span className="font-black">36.5</span>
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
                        <span className="font-black text-cyan-900">0.8542</span>
                      </div>
                      <div className="w-full bg-cyan-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(0.8542 / 1.2) * 100}%` }}
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
                        <span className="font-black text-cyan-900">0.0234</span>
                      </div>
                      <div className="w-full bg-red-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(0.0234 / 0.1) * 100}%` }}
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
                        <span className="font-black text-cyan-900">36.5</span>
                      </div>
                      <div className="w-full bg-green-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(36.5 / 50) * 100}%` }}
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        type="simulation"
        metrics={simulationMetrics}
      />
    </div>
  );
}
