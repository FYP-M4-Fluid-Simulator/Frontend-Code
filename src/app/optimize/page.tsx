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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InteractiveAirfoilCanvas } from "../../components/InteractiveAirfoilCanvas";
import { useRouter } from "next/navigation";

export default function OptimizePage() {
  const router = useRouter();
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);

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
  const [showPressureField, setShowPressureField] = useState(true);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(false);
  const [showControlPoints, setShowControlPoints] = useState(false);

  // Optimization parameters
  const [targetLiftDrag, setTargetLiftDrag] = useState(70);
  const [populationSize, setPopulationSize] = useState(30);
  const [mutationRate, setMutationRate] = useState(0.1);

  // Optimization results
  const [bestLiftCoeff, setBestLiftCoeff] = useState(0);
  const [bestDragCoeff, setBestDragCoeff] = useState(0);
  const [bestLDRatio, setBestLDRatio] = useState(0);

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
          targetLiftDrag,
          populationSize,
          mutationRate,
          maxIterations,
        }),
      });

      // Simulate optimization progress with morphing airfoil
      const interval = setInterval(() => {
        setOptimizationIteration((prev) => {
          if (prev >= maxIterations) {
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
                generations: maxIterations,
                populationSize: populationSize,
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
          if (prev >= maxIterations) {
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
                generations: maxIterations,
                populationSize: populationSize,
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

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-green-600">
            <Download className="w-3.5 h-3.5" />
            Export Results
          </button>
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
        {/* Left Full Sidebar - Optimization Parameters */}
        <AnimatePresence>
          {showOptimizationPanel && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-20"
                onClick={() => setShowOptimizationPanel(false)}
              />

              <motion.div
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-[130px] bottom-0 w-96 shadow-2xl border-r-2 border-orange-400 z-30 flex flex-col"
                style={{
                  background: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 0 40px 12px rgba(249, 115, 22, 0.25)",
                }}
              >
                <div className="p-4 bg-gradient-to-r from-orange-600 to-pink-600 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Optimization Settings
                    </h3>
                    <p className="text-xs text-orange-100 mt-0.5">
                      Genetic algorithm parameters
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOptimizationPanel(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  <div>
                    <label className="text-sm font-black text-gray-900 mb-3 block">
                      Target L/D Ratio
                    </label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={targetLiftDrag}
                        onChange={(e) =>
                          setTargetLiftDrag(Number(e.target.value))
                        }
                        className="flex-1 h-2 accent-orange-500"
                      />
                      <input
                        type="number"
                        value={targetLiftDrag}
                        onChange={(e) =>
                          setTargetLiftDrag(Number(e.target.value))
                        }
                        className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Target: {targetLiftDrag}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-black text-gray-900 mb-3 block">
                      Population Size
                    </label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={populationSize}
                        onChange={(e) =>
                          setPopulationSize(Number(e.target.value))
                        }
                        className="flex-1 h-2 accent-pink-500"
                      />
                      <input
                        type="number"
                        value={populationSize}
                        onChange={(e) =>
                          setPopulationSize(Number(e.target.value))
                        }
                        className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Individuals per generation: {populationSize}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-black text-gray-900 mb-3 block">
                      Max Iterations
                    </label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="range"
                        min={10}
                        max={200}
                        step={10}
                        value={maxIterations}
                        onChange={(e) =>
                          setMaxIterations(Number(e.target.value))
                        }
                        className="flex-1 h-2 accent-purple-500"
                      />
                      <input
                        type="number"
                        value={maxIterations}
                        onChange={(e) =>
                          setMaxIterations(Number(e.target.value))
                        }
                        className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Generations: {maxIterations}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-black text-gray-900 mb-3 block">
                      Mutation Rate
                    </label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="range"
                        min={0}
                        max={0.5}
                        step={0.01}
                        value={mutationRate}
                        onChange={(e) =>
                          setMutationRate(Number(e.target.value))
                        }
                        className="flex-1 h-2 accent-red-500"
                      />
                      <input
                        type="number"
                        value={mutationRate.toFixed(2)}
                        onChange={(e) =>
                          setMutationRate(Number(e.target.value))
                        }
                        className="w-20 px-3 py-2 text-sm border border-gray-300 rounded font-semibold"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Probability: {(mutationRate * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="text-xs font-black text-orange-900 mb-2">
                      🧬 Genetic Algorithm
                    </h4>
                    <ul className="text-xs text-orange-800 space-y-1 font-medium">
                      <li>• Evolves CST coefficients</li>
                      <li>• Selects fittest airfoils</li>
                      <li>• Crossover & mutation operators</li>
                      <li>• Converges to optimal shape</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="absolute left-4 top-4 z-30">
          <button
            onClick={() => setShowOptimizationPanel(!showOptimizationPanel)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-lg transition-all text-xs font-bold shadow-lg"
          >
            <Settings className="w-4 h-4" />
            <span>Optimization Settings</span>
          </button>
        </div>

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
                    Gen: {optimizationIteration} / {maxIterations}
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-pink-600 h-full transition-all duration-300"
                      style={{
                        width: `${(optimizationIteration / maxIterations) * 100}%`,
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
                      <span>Current Generation:</span>
                      <span className="font-black">
                        {optimizationIteration}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Population Size:</span>
                      <span className="font-black">{populationSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mutation Rate:</span>
                      <span className="font-black">
                        {(mutationRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="font-black">
                        {(
                          (optimizationIteration / maxIterations) *
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
