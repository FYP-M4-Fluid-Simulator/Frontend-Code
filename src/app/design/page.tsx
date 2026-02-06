"use client";

import { useState, useRef, useEffect } from "react";
import {
  Wind,
  Settings,
  Download,
  Save,
  LogOut,
  Plus,
  Trash2,
  ArrowRight,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  FilePlus,
  FolderOpen,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InteractiveAirfoilCanvas } from "../../components/InteractiveAirfoilCanvas";
import {
  createSimulationConfig,
  downloadConfigFile,
} from "../../lib/exportData";
import { useRouter } from "next/navigation";
import { PYTHON_BACKEND_URL } from "@/config";

if (!PYTHON_BACKEND_URL) {
  throw new Error("Python backend URL is not defined.");
} else {
  console.log("PYTHON_BACKEND_URL is set to:", PYTHON_BACKEND_URL);
}

export default function DesignPage() {
  const router = useRouter();
  const [showSimDesignerDropdown, setShowSimDesignerDropdown] = useState(false);
  const [showAirfoilDesignDropdown, setShowAirfoilDesignDropdown] =
    useState(false);

  // CST Coefficients
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([
    0.15, 0.2, 0.18, 0.12, 0.08,
  ]);

  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([
    -0.1, -0.12, -0.09, -0.06, -0.04,
  ]);

  // Flow parameters
  const [angleOfAttack, setAngleOfAttack] = useState(5);
  const [velocity, setVelocity] = useState(15);
  const [meshDensity, setMeshDensity] = useState<
    "coarse" | "medium" | "fine" | "ultra"
  >("medium");
  const [showPressureField, setShowPressureField] = useState(false);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(true);
  const [showControlPoints, setShowControlPoints] = useState(true);

  // Zoom level
  const [zoomLevel, setZoomLevel] = useState(100);

  // Modal and file handling states
  const [showNewDesignModal, setShowNewDesignModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  // const [conversionProgress, setConversionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal and file handling states
  // const [showNewDesignModal, setShowNewDesignModal] = useState(false);
  // const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas dimensions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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

  const updateCSTCoefficient = async (
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

    // Call API (dummy for now)
    try {
      await fetch("/api/cst/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surface, index, value }),
      });
    } catch (error) {
      console.log("API call would happen here:", { surface, index, value });
    }
    // try {

    //     await fetch(PYTHON_BACKEND_URL + "/cst/get_cst_values" || "bhai_backend_url_tou_daalo??", {
    //       method: "GET",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ surface, index, value }),
    //     });
    //   } catch (error) {
    //     console.log("API call failed:", error);
    //   }
  };

  const handleSaveDesign = () => {
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
    downloadConfigFile(config, `airfoil-design-${timestamp}.json`);
  };

  const handleResetDesign = () => {
    setUpperCoefficients([0.15, 0.2, 0.18, 0.12, 0.08]);
    setLowerCoefficients([-0.1, -0.12, -0.09, -0.06, -0.04]);
    setAngleOfAttack(5);
    setVelocity(15);
  };

  const handleStartWithDefault = () => {
    handleResetDesign();
    setShowNewDesignModal(false);
  };

  const handleImportFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith(".dat")) {
      alert("Please select a valid .dat file");
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);
    setShowNewDesignModal(false);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setConversionProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const formData = new FormData();
      formData.append("file", file);
      console.log(
        "sending reqest to url :" + PYTHON_BACKEND_URL + "cst/get_cst_values",
      );
      const response = await fetch(PYTHON_BACKEND_URL + "cst/get_cst_values", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Conversion failed");
      }

      const data = await response.json();

      console.log("RESPONSE RECEIVED FROM BACKEND: ", data);

      // Update coefficients with converted data
      setUpperCoefficients(data.upperCoefficients);
      setLowerCoefficients(data.lowerCoefficients);

      setConversionProgress(100);
      setTimeout(() => {
        setIsConverting(false);
        setConversionProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error converting file:", error);
      alert("Failed to convert .dat file. Please try again.");
      setIsConverting(false);
      setConversionProgress(0);
    }

    // Reset file input
    event.target.value = "";
  };

  const addCSTCoefficient = (surface: "upper" | "lower") => {
    if (surface === "upper") {
      setUpperCoefficients([...upperCoefficients, 0.05]);
    } else {
      setLowerCoefficients([...lowerCoefficients, -0.05]);
    }
  };

  const removeCSTCoefficient = (surface: "upper" | "lower", index: number) => {
    if (surface === "upper" && upperCoefficients.length > 2) {
      setUpperCoefficients(upperCoefficients.filter((_, i) => i !== index));
    } else if (surface === "lower" && lowerCoefficients.length > 2) {
      setLowerCoefficients(lowerCoefficients.filter((_, i) => i !== index));
    }
  };

  const handleFinalizeDesign = () => {
    // Store state in sessionStorage for other pages
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
    router.push("/finalize");
  };

  // Auto-open sidebar when control point is dragged
  const handleControlPointDragStart = () => {
    setShowAirfoilDesignDropdown(true);
  };

  const handleControlPointDragEnd = () => {
    // Keep sidebar open when drag ends
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* SimScale-Style Top Toolbar */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-4 py-2.5 shadow-sm z-40">
        {/* Left: File Operations */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewDesignModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
            Start New Design
          </button>

          <button
            onClick={() => router.push("/turbine")}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 hover:border-green-300 rounded text-xs font-medium text-green-700 hover:text-green-800 transition-all"
          >
            <Wind className="w-3.5 h-3.5" />
            View Turbine
          </button>
        </div>

        {/* Right: Save and User */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDesign}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Account"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-50">
        {/* Left Full Sidebar - Simulation Designer */}
        <AnimatePresence>
          {showSimDesignerDropdown && (
            <>
              {/* Overlay - more transparent to see through */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-20"
                onClick={() => setShowSimDesignerDropdown(false)}
              />

              {/* Sidebar - Semi-transparent with glassmorphism */}
              <motion.div
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-[130px] bottom-0 w-96 shadow-2xl border-r-2 border-blue-400 z-30 flex flex-col"
                style={{
                  background: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 0 40px 12px rgba(59, 130, 246, 0.25)",
                }}
              >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Simulation Designer
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      Flow & simulation parameters
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSimDesignerDropdown(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Velocity */}
                  <div>
                    <label className="text-sm font-black text-gray-900 mb-3 block">
                      Flow Velocity (m/s)
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

                  {/* Angle of Attack */}
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

                  <div className="border-t-2 border-gray-200 pt-6">
                    <h4 className="text-sm font-black text-gray-900 mb-4">
                      Time-Step Configuration
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 block">
                          Start Time (s)
                        </label>
                        <input
                          type="number"
                          defaultValue={0}
                          step={0.1}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 block">
                          End Time (s)
                        </label>
                        <input
                          type="number"
                          defaultValue={10}
                          step={0.5}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 block">
                          Time Step Δt (s)
                        </label>
                        <input
                          type="number"
                          defaultValue={0.001}
                          step={0.0001}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 block">
                          CPU Cores
                        </label>
                        <select
                          defaultValue={4}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                        >
                          <option value={1}>1 Core</option>
                          <option value={2}>2 Cores</option>
                          <option value={4}>4 Cores</option>
                          <option value={8}>8 Cores</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="text-xs font-black text-blue-900 mb-2">
                      ℹ️ Computational Estimate
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1 font-medium">
                      <li>• Total Steps: ~10,000</li>
                      <li>• Est. Runtime: 2.5 minutes (4 cores)</li>
                      <li>• Output Size: ~850 MB</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Left Sidebar Trigger Button */}
        <div className="absolute left-4 top-4 z-30">
          <button
            onClick={() => setShowSimDesignerDropdown(!showSimDesignerDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-xs font-bold shadow-lg"
            style={{ boxShadow: "0 0 0 1px rgba(147, 51, 234, 0)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 12px 3px rgba(147, 51, 234, 0.5)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 0 1px rgba(147, 51, 234, 0)")
            }
          >
            <Settings className="w-4 h-4" />
            <span>Simulation Designer</span>
          </button>
        </div>

        {/* Right Full Sidebar - Airfoil Design (CST Coefficients) */}
        <>
          <AnimatePresence>
            {showAirfoilDesignDropdown && (
              <>
                {/* No overlay - let user see through the sidebar */}

                {/* Sidebar - Semi-transparent with glassmorphism */}
                <motion.div
                  initial={{ x: 400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 400, opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed right-0 top-[130px] bottom-0 w-96 shadow-2xl border-l-2 border-green-400 z-30 flex flex-col"
                  style={{
                    background: "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "0 0 40px 12px rgba(16, 185, 129, 0.25)",
                  }}
                >
                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Wind className="w-5 h-5" />
                        Airfoil Design
                      </h3>
                      <p className="text-xs text-green-100 mt-0.5">
                        CST parametrization coefficients
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAirfoilDesignDropdown(false)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {/* Upper Surface */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-black text-blue-700">
                          Upper Surface (A<sub>u</sub>)
                        </h4>
                        <button
                          onClick={() => addCSTCoefficient("upper")}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      <div className="space-y-3">
                        {upperCoefficients.map((coeff, index) => (
                          <div
                            key={`upper-${index}`}
                            className="flex items-center gap-2"
                          >
                            <span className="text-sm font-bold text-gray-700 w-14">
                              A<sub>u,{index}</sub>
                            </span>
                            <input
                              type="range"
                              min={-0.5}
                              max={0.5}
                              step={0.01}
                              value={coeff}
                              onChange={(e) =>
                                updateCSTCoefficient(
                                  "upper",
                                  index,
                                  Number(e.target.value),
                                )
                              }
                              className="flex-1 h-2 accent-blue-600"
                            />
                            <input
                              type="number"
                              value={coeff.toFixed(3)}
                              onChange={(e) =>
                                updateCSTCoefficient(
                                  "upper",
                                  index,
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 px-2 py-1.5 text-sm border border-blue-300 rounded font-mono"
                            />
                            <button
                              onClick={() =>
                                removeCSTCoefficient("upper", index)
                              }
                              disabled={upperCoefficients.length <= 2}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lower Surface */}
                    <div className="border-t-2 border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-black text-green-700">
                          Lower Surface (A<sub>l</sub>)
                        </h4>
                        <button
                          onClick={() => addCSTCoefficient("lower")}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      <div className="space-y-3">
                        {lowerCoefficients.map((coeff, index) => (
                          <div
                            key={`lower-${index}`}
                            className="flex items-center gap-2"
                          >
                            <span className="text-sm font-bold text-gray-700 w-14">
                              A<sub>l,{index}</sub>
                            </span>
                            <input
                              type="range"
                              min={-0.5}
                              max={0.5}
                              step={0.01}
                              value={coeff}
                              onChange={(e) =>
                                updateCSTCoefficient(
                                  "lower",
                                  index,
                                  Number(e.target.value),
                                )
                              }
                              className="flex-1 h-2 accent-green-600"
                            />
                            <input
                              type="number"
                              value={coeff.toFixed(3)}
                              onChange={(e) =>
                                updateCSTCoefficient(
                                  "lower",
                                  index,
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 px-2 py-1.5 text-sm border border-green-300 rounded font-mono"
                            />
                            <button
                              onClick={() =>
                                removeCSTCoefficient("lower", index)
                              }
                              disabled={lowerCoefficients.length <= 2}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Right Sidebar Trigger Button */}
          <div className="absolute right-4 top-4 z-30">
            <button
              onClick={() =>
                setShowAirfoilDesignDropdown(!showAirfoilDesignDropdown)
              }
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all text-xs font-bold shadow-lg"
              style={{ boxShadow: "0 0 0 1px rgba(16, 185, 129, 0)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 12px 3px rgba(16, 185, 129, 0.5)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 0 1px rgba(16, 185, 129, 0)")
              }
            >
              <Wind className="w-4 h-4" />
              <span>Airfoil Design</span>
            </button>
          </div>
        </>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-4">
          {/* Top Row: Zoom Controls */}
          <div className="flex justify-center">
            {/* Zoom Controls - Center */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm px-2 py-1.5">
              <button
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-gray-700 px-2 min-w-[45px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                title="Reset View"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <select
                value={meshDensity}
                onChange={(e) => setMeshDensity(e.target.value as any)}
                className="text-xs border-0 bg-transparent font-medium text-gray-700 focus:outline-none cursor-pointer pr-6"
              >
                <option value="coarse">Coarse Mesh</option>
                <option value="medium">Medium Mesh</option>
                <option value="fine">Fine Mesh</option>
                <option value="ultra">Ultra Mesh</option>
              </select>
            </div>
          </div>

          {/* Canvas */}
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
                designMode={true}
                onControlPointDragStart={handleControlPointDragStart}
                onControlPointDragEnd={handleControlPointDragEnd}
              />
            </div>
          </div>
          {/* Bottom Controls */}
          <div className="flex items-center justify-between">
            {/* Visualization Controls - Left */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-gray-200">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showControlPoints}
                  onChange={(e) => setShowControlPoints(e.target.checked)}
                  className="w-3 h-3 accent-blue-600"
                />
                Control Points
              </label>

              <div className="w-px h-3 bg-gray-300" />

              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:text-green-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showMeshOverlay}
                  onChange={(e) => setShowMeshOverlay(e.target.checked)}
                  className="w-3 h-3 accent-green-600"
                />
                Grid Overlay
              </label>

              <div className="w-px h-3 bg-gray-300" />

              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:text-purple-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showVectorField}
                  onChange={(e) => setShowVectorField(e.target.checked)}
                  className="w-3 h-3 accent-purple-600"
                />
                Wind Arrows
              </label>

              <div className="w-px h-3 bg-gray-300" />

              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:text-orange-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showPressureField}
                  onChange={(e) => setShowPressureField(e.target.checked)}
                  className="w-3 h-3 accent-orange-600"
                />
                Pressure Field
              </label>
            </div>

            {/* Simulation Button - Right */}
            <button
              onClick={handleFinalizeDesign}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-semibold shadow-lg text-sm border border-cyan-400"
            >
              <ArrowRight className="w-4 h-4" />
              Finalize Design
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".dat"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* New Design Modal */}
      {showNewDesignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FilePlus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Start New Design
                </h3>
                <p className="text-sm text-gray-600">
                  Choose how you'd like to begin your airfoil design
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={handleStartWithDefault}
                  className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Wind className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900">
                        Default Airfoil
                      </div>
                      <div className="text-xs text-gray-600">
                        Start with NACA-like symmetric profile
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleImportFromFile}
                  className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900">
                        Import .dat File
                      </div>
                      <div className="text-xs text-gray-600">
                        Load airfoil coordinates from file
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowNewDesignModal(false)}
                className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Loading Overlay */}
      {isConverting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Settings className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Converting to CST
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Processing airfoil coordinates...
              </p>

              <div className="relative w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${conversionProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {Math.round(conversionProgress)}% complete
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
