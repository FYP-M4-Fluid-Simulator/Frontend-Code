"use client";

import { useState, useRef, useEffect } from "react";
import {
  Wind,
  Settings,
  Plus,
  Trash2,
  ArrowRight,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  FilePlus,
  FolderOpen,
  User,
  ChevronRight,
  Database,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InteractiveAirfoilCanvas } from "../../components/InteractiveAirfoilCanvas";
import { generateCSTAirfoil } from "../../lib/cst";
import { useRouter } from "next/navigation";
import { PYTHON_BACKEND_URL } from "@/config";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

// Reusable number input component with improved UX
function EditableNumberInput({
  value,
  onChange,
  step = 0.01,
  decimals = 3,
  min,
  max,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  decimals?: number;
  min?: number;
  max?: number;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(true);
    setEditValue(value.toFixed(decimals));
    // Select all text for easy replacement
    e.target.select();
  };

  const handleBlur = () => {
    applyValue();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyValue();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue("");
      inputRef.current?.blur();
    }
  };

  const applyValue = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      let finalValue = parsed;
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;
      onChange(finalValue);
    }
    setIsEditing(false);
    setEditValue("");
  };

  return (
    <input
      ref={inputRef}
      type="number"
      step={step}
      value={isEditing ? editValue : value.toFixed(decimals)}
      onChange={(e) => setEditValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} ${isEditing ? "ring-2 ring-blue-400 border-blue-400" : ""}`}
    />
  );
}

if (!PYTHON_BACKEND_URL) {
  throw new Error("Python backend URL is not defined.");
} else {
  console.log("PYTHON_BACKEND_URL is set to:", PYTHON_BACKEND_URL);
}

export default function DesignPage() {
  const router = useRouter();

  // TODO: Replace with actual user ID from authentication context
  const USER_ID = "dINHzGHWkBNK147w6azLXc5Uc582";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"cst" | "simulation">("cst");

  // CST Coefficients - using symmetric airfoil values that match Python example
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([
    0.17104533, 0.15300564, 0.1501825, 0.135824, 0.14169314,
  ]);

  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([
    -0.17104533,
    -0.15300564,
    -0.1501825,
    -0.135824,
    -0.14169314, // Negative for lower surface
  ]);

  // Flow parameters
  const [angleOfAttack, setAngleOfAttack] = useState(0);
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
  const [leadingEdgeRadius, setLeadingEdgeRadius] = useState(0.015867);
  const [numBernsteinCoefficients, setNumBernsteinCoefficients] = useState(8);

  // Modal and file handling states
  const [showNewDesignModal, setShowNewDesignModal] = useState(false);
  const [showLeadingEdgeModal, setShowLeadingEdgeModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas dimensions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load airfoil data from sessionStorage if available
  useEffect(() => {
    // Check for CST coefficients from imported file
    const storedCoefficients = sessionStorage.getItem("cstCoefficients");
    if (storedCoefficients) {
      try {
        const { upper, lower } = JSON.parse(storedCoefficients);
        if (upper && lower) {
          setUpperCoefficients(upper);
          setLowerCoefficients(lower);
        }
        // Clear the stored data after loading
        sessionStorage.removeItem("cstCoefficients");
      } catch (error) {
        console.error("Error loading CST coefficients:", error);
      }
    }

    // Check for selected airfoil from saved designs
    const selectedAirfoil = sessionStorage.getItem("selectedAirfoil");
    if (selectedAirfoil) {
      try {
        const airfoil = JSON.parse(selectedAirfoil);
        console.log("Loading selected airfoil:", airfoil);

        // If the airfoil has CST coefficients, load them
        if (airfoil.upperCoefficients && airfoil.lowerCoefficients) {
          setUpperCoefficients(airfoil.upperCoefficients);
          setLowerCoefficients(airfoil.lowerCoefficients);
        }

        // Load other parameters if available
        if (airfoil.chordLength !== undefined) {
          setChordLength(airfoil.chordLength);
        }
        if (airfoil.angleOfAttack !== undefined) {
          setAngleOfAttack(airfoil.angleOfAttack);
        }

        // Clear the stored data after loading
        sessionStorage.removeItem("selectedAirfoil");
      } catch (error) {
        console.error("Error loading selected airfoil:", error);
      }
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

    // Small delay to allow sidebar animation to complete (300ms transition)
    const timer = setTimeout(updateSize, 350);
    window.addEventListener("resize", updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateSize);
    };
  }, [isSidebarOpen]);

  const updateCSTCoefficient = async (
    surface: "upper" | "lower",
    index: number,
    value: number,
  ) => {
    // Update local coefficients array
    const newUpperCoeffs =
      surface === "upper"
        ? [...upperCoefficients].map((coeff, i) =>
          i === index ? value : coeff,
        )
        : [...upperCoefficients];

    const newLowerCoeffs =
      surface === "lower"
        ? [...lowerCoefficients].map((coeff, i) =>
          i === index ? value : coeff,
        )
        : [...lowerCoefficients];

    // Update state
    if (surface === "upper") {
      setUpperCoefficients(newUpperCoeffs);
    } else {
      setLowerCoefficients(newLowerCoeffs);
    }

    // Calculate airfoil locally using the CST function
    try {
      const result = generateCSTAirfoil(
        newUpperCoeffs,
        newLowerCoeffs,
        0, // trailingEdgeThickness
        100, // numPoints
      );

      console.log(`[CST Update] Complete airfoil recalculated:`, {
        totalPoints: result.coordinates.length,
        upperPoints: result.upperCoordinates.length,
        lowerPoints: result.lowerCoordinates.length,
        changedSurface: surface,
        changedIndex: index,
        newValue: value,
      });
    } catch (error) {
      console.error("CST update error:", error);
    }
  };

  const handleStartWithDefault = () => {
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

    // Show modal to get leading edge radius
    setSelectedFile(file);
    setShowNewDesignModal(false);
    setShowLeadingEdgeModal(true);

    // Reset file input
    event.target.value = "";
  };

  const handleLeadingEdgeSubmit = async () => {
    if (!selectedFile) return;

    setShowLeadingEdgeModal(false);
    setIsConverting(true);
    setConversionProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setConversionProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("leadingEdgeRadius", leadingEdgeRadius.toString());
      formData.append("numCoefficients", numBernsteinCoefficients.toString());

      // Ensure proper URL format with slash

      const apiUrl = `${PYTHON_BACKEND_URL}${PYTHON_BACKEND_URL?.endsWith("/") ? "" : "/"}get_cst_values?user_id=${USER_ID}`;

      console.log("=== API Request Details ===");
      console.log("URL:", apiUrl);
      console.log("Leading Edge Radius:", leadingEdgeRadius);
      console.log("Num Coefficients:", numBernsteinCoefficients);
      console.log("File:", selectedFile.name);
      console.log("==========================");

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (progressInterval) clearInterval(progressInterval);

      console.log("Response status:", response.status);
      console.log("Response statusText:", response.statusText);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error("Error response data:", errorData);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.error("Error response text:", errorText);
            if (errorText) errorMessage = errorText;
          } catch (e2) {
            console.error("Could not parse error response");
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      console.log("=== API Response ===");
      console.log("Full response:", data);
      console.log("Upper coefficients:", data.upperCoefficients);
      console.log("Lower coefficients:", data.lowerCoefficients);
      console.log("===================");

      // Validate response data
      if (!data.upperCoefficients || !data.lowerCoefficients) {
        throw new Error("Invalid response: Missing coefficient data");
      }

      // Update coefficients with converted data
      setUpperCoefficients(data.upperCoefficients);
      setLowerCoefficients(data.lowerCoefficients);

      setConversionProgress(100);
      setTimeout(() => {
        setIsConverting(false);
        setConversionProgress(0);
        setSelectedFile(null);
      }, 500);
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);

      console.error("=== Conversion Error ===");
      console.error("Error:", error);
      console.error("Error type:", typeof error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error),
      );
      console.error("=======================");

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(
        `Failed to convert .dat file:\n\n${errorMessage}\n\nCheck console for details.`,
      );

      setIsConverting(false);
      setConversionProgress(0);
      setSelectedFile(null);
    }
  };

  const addCSTCoefficient = (surface: "upper" | "lower") => {
    if (surface === "upper") {
      setUpperCoefficients([...upperCoefficients, 0.05]);
    } else {
      setLowerCoefficients([...lowerCoefficients, -0.05]); // Negative for lower surface
    }
  };

  const addCSTCoefficient2 = () => {
    // Add coefficients to both surfaces maintaining the pattern
    setUpperCoefficients([...upperCoefficients, 0.05]);
    setLowerCoefficients([...lowerCoefficients, -0.05]); // Negative for lower surface
  };

  const removeCSTCoefficient = (surface: "upper" | "lower", index: number) => {
    if (surface === "upper" && upperCoefficients.length > 2) {
      setUpperCoefficients(upperCoefficients.filter((_, i) => i !== index));
    } else if (surface === "lower" && lowerCoefficients.length > 2) {
      setLowerCoefficients(lowerCoefficients.filter((_, i) => i !== index));
    }
  };

  const removeCSTCoefficient2 = (index: number) => {
    // Remove coefficient from both surfaces to maintain matching lengths
    if (upperCoefficients.length > 2 && lowerCoefficients.length > 2) {
      setUpperCoefficients(upperCoefficients.filter((_, i) => i !== index));
      setLowerCoefficients(lowerCoefficients.filter((_, i) => i !== index));
    }
  };

  const handleNavigateToSimulate = () => {
    // Store state in sessionStorage for simulation page
    sessionStorage.setItem(
      "cfdState",
      JSON.stringify({
        upperCoefficients,
        lowerCoefficients,
        angleOfAttack,
        velocity,
        meshDensity,
        chordLength,
      }),
    );
    router.push("/simulate");
  };

  const handleNavigateToOptimize = () => {
    // Store state in sessionStorage for optimization page
    sessionStorage.setItem(
      "cfdState",
      JSON.stringify({
        upperCoefficients,
        lowerCoefficients,
        angleOfAttack,
        velocity,
        meshDensity,
        chordLength,
      }),
    );
    router.push("/optimize");
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

        {/* Right: User */}
        <div className="flex items-center gap-3">
          <UserProfileDropdown />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-50">
        {/*  Left Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Sidebar - Semi-transparent with glassmorphism */}
              <motion.div
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="shadow-2xl border-r-2 border-blue-400 z-30 flex flex-col bg-white"
              >
                {/* Tab Header */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("cst")}
                    className={`flex-1 px-4 py-3 text-sm font-bold transition-all ${activeTab === "cst"
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
                        <EditableNumberInput
                          value={chordLength}
                          onChange={setChordLength}
                          step={0.1}
                          decimals={1}
                          min={0.5}
                          max={2.0}
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
                          onClick={() => addCSTCoefficient2()}
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
                              min={0.0}
                              max={2.0}
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
                            <EditableNumberInput
                              value={coeff}
                              onChange={(newValue) =>
                                updateCSTCoefficient("upper", index, newValue)
                              }
                              step={0.0001}
                              decimals={4}
                              min={0.0}
                              max={2.0}
                              className="w-28 px-2 py-1.5 text-sm border border-blue-300 rounded font-mono"
                            />
                            <button
                              onClick={() => removeCSTCoefficient2(index)}
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
                          onClick={() => addCSTCoefficient2()}
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
                              min={-2.0}
                              max={0.0}
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
                            <EditableNumberInput
                              value={coeff}
                              onChange={(newValue) =>
                                updateCSTCoefficient("lower", index, newValue)
                              }
                              step={0.0001}
                              decimals={4}
                              min={-2.0}
                              max={0.0}
                              className="w-28 px-2 py-1.5 text-sm border border-green-300 rounded font-mono"
                            />
                            <button
                              onClick={() => removeCSTCoefficient2(index)}
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
          </div>
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleNavigateToSimulate}
              className="flex-1 flex justify-center items-center bg-[#1F91FF] hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-lg transition-all font-semibold shadow-lg text-sm border border-cyan-400"
            >
              <Settings className="w-5 h-5 mr-2" />
              Start Simulation
            </button>
            <button
              onClick={handleNavigateToOptimize}
              className="flex-1 flex justify-center items-center bg-[#DE3000] hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-all font-semibold shadow-lg text-sm border border-pink-400"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Start Optimization
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
                {/* View all airfoils */}
                <button
                  onClick={() => router.push("/airfoil_deck")}
                  className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900">
                        View All Airfoils
                      </div>
                      <div className="text-xs text-gray-600">
                        Browse and select existing airfoils
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

      {/* Airfoil Parameters Modal */}
      {showLeadingEdgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Airfoil Parameters
                </h3>
                <p className="text-sm text-gray-600">
                  Configure CST conversion parameters
                </p>
              </div>

              <div className="space-y-5 mb-6">
                {/* Bernstein Coefficients */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Bernstein Coefficients
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={14}
                    value={numBernsteinCoefficients}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 4 && value <= 14) {
                        setNumBernsteinCoefficients(value);
                      }
                    }}
                    className="w-full px-4 py-3 text-lg border-2 border-blue-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Range: 4-14 control points (default: 8)
                  </p>
                </div>

                {/* Leading Edge Radius */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Leading Edge Radius (r<sub>LE</sub>)
                  </label>
                  <input
                    type="text"
                    value={leadingEdgeRadius.toFixed(6)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setLeadingEdgeRadius(value);
                      }
                    }}
                    className="w-full px-4 py-3 text-lg border-2 border-orange-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.015867"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Typical values: 0.005 - 0.02 for most airfoils
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLeadingEdgeModal(false);
                    setSelectedFile(null);
                    setLeadingEdgeRadius(0.015867);
                    setNumBernsteinCoefficients(8);
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeadingEdgeSubmit}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all shadow-md"
                >
                  OK
                </button>
              </div>
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
