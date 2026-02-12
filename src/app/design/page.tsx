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
  ChevronRight,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"cst" | "simulation">("cst");

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

  // Zoom level and chord length
  const [zoomLevel, setZoomLevel] = useState(100);
  const [chordLength, setChordLength] = useState(1.0);

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
    setIsSidebarOpen(true);
    setActiveTab("cst");
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
        {/* Combined Left Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Sidebar - Semi-transparent with glassmorphism */}
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
                    onClick={() => setActiveTab("cst")}
                    className={`flex-1 px-4 py-3 text-sm font-bold transition-all ${
                      activeTab === "cst"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Wind className="w-4 h-4" />
                      <span>Airfoil Design</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("simulation")}
                    className={`flex-1 px-4 py-3 text-sm font-bold transition-all ${
                      activeTab === "simulation"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>Simulation</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="px-3 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
                  </button>
                </div>

                {/* Content - CST Parameters */}
                {activeTab === "cst" && (
                  <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                      {/* Chord Length Control */}
                    <div className="border-t-2 border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-black text-purple-700">
                          Chord Length (c)
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-700 w-14">
                          c
                        </span>
                        <input
                          type="range"
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          value={chordLength}
                          onChange={(e) =>
                            setChordLength(Number(e.target.value))
                          }
                          className="flex-1 h-2 accent-purple-600"
                        />
                        <input
                          type="number"
                          value={chordLength.toFixed(1)}
                          onChange={(e) =>
                            setChordLength(Number(e.target.value))
                          }
                          className="w-24 px-2 py-1.5 text-sm border border-purple-300 rounded font-mono"
                        />
                      </div>
                    </div>

                    
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
                )}

                {/* Content - Simulation Parameters */}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Sidebar Toggle Button (when closed) */}
        {/* {!isSidebarOpen && (
          <div className="absolute left-4 top-4 z-30">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-400 hover:to-blue-900 text-white rounded-lg transition-all text-xs font-bold shadow-lg"
            >
              <Wind className="w-4 h-4" />
              <span>Open Sidebar</span>
            </button>
          </div>
        )} */}
        {/* Replace your !isSidebarOpen block with this */}`
        {!isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-0 top-0 bottom-0 w-4 group cursor-pointer z-40 flex items-center shadow-inner"
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
        `{/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-4 transition-all duration-300">
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
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative" ref={canvasRef}>
            <div
              className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #0B1628 0%, #1a2942 50%, #0B1628 100%)",
                border: "2px solid rgba(59, 130, 246, 0.3)",
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
                zoomLevel={zoomLevel}
                chordLength={chordLength}
              />
            </div>
          </div>
          {/* Bottom Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Control Points Toggle - Center Below Canvas */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-gray-300">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showControlPoints}
                  onChange={(e) => setShowControlPoints(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                Show Control Points
              </label>
            </div>

            {/* Finalize Button */}
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
