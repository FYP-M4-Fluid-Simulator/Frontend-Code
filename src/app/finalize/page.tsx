"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Settings,
  User,
  Save,
  FilePlus,
  FolderOpen,
} from "lucide-react";
import { InteractiveAirfoilCanvas } from "../../components/InteractiveAirfoilCanvas";
import { useRouter } from "next/navigation";

export default function FinalizePage() {
  const router = useRouter();

  // State loaded from sessionStorage
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([]);
  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([]);
  const [angleOfAttack, setAngleOfAttack] = useState(5);
  const [velocity, setVelocity] = useState(15);
  const [meshDensity, setMeshDensity] = useState<
    "coarse" | "medium" | "fine" | "ultra"
  >("medium");

  // Display options - fixed values for final view
  const [showPressureField, setShowPressureField] = useState(true);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(false);
  const [showControlPoints, setShowControlPoints] = useState(false);

  // Zoom level
  const [zoomLevel, setZoomLevel] = useState(100);

  // Canvas dimensions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load data from sessionStorage on component mount
  useEffect(() => {
    const savedState = sessionStorage.getItem("cfdState");
    if (savedState) {
      const state = JSON.parse(savedState);
      setUpperCoefficients(
        state.upperCoefficients || [0.15, 0.2, 0.18, 0.12, 0.08],
      );
      setLowerCoefficients(
        state.lowerCoefficients || [-0.1, -0.12, -0.09, -0.06, -0.04],
      );
      setAngleOfAttack(state.angleOfAttack || 5);
      setVelocity(state.velocity || 15);
      setMeshDensity(state.meshDensity || "medium");
    } else {
      // Fallback to default values
      setUpperCoefficients([0.15, 0.2, 0.18, 0.12, 0.08]);
      setLowerCoefficients([-0.1, -0.12, -0.09, -0.06, -0.04]);
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

  const handleProceedToSimulation = () => {
    // Data is already in sessionStorage from design page
    router.push("/simulate");
  };

  const handleProceedToOptimization = () => {
    // Data is already in sessionStorage from design page
    router.push("/optimize");
  };

  const handleBackToDesign = () => {
    router.push("/design");
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-4 py-2.5 shadow-sm z-40">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackToDesign}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
          >
            ← Back to Design
          </button>
        </div>

        {/* Center: Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">
            Final Airfoil Design
          </h1>
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Home"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-50">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-4">
          {/* Configuration Summary */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 max-w-2xl">
              <h3 className="text-sm font-bold text-blue-900 mb-3 text-center">
                Final Design Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-800">
                <div className="text-center">
                  <span className="block font-semibold">Coefficients</span>
                  <span className="text-blue-600">
                    {upperCoefficients.length + lowerCoefficients.length} total
                  </span>
                </div>
                <div className="text-center">
                  <span className="block font-semibold">Velocity</span>
                  <span className="text-blue-600">{velocity} m/s</span>
                </div>
                <div className="text-center">
                  <span className="block font-semibold">Angle of Attack</span>
                  <span className="text-blue-600">{angleOfAttack}°</span>
                </div>
                <div className="text-center">
                  <span className="block font-semibold">Mesh Quality</span>
                  <span className="text-blue-600 capitalize">
                    {meshDensity}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex justify-center">
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
                onCoefficientChange={() => {}} // No editing allowed
                allowFullScreen={false} // Disable full screen
                designMode={false} // Read-only mode
                onControlPointDragStart={() => {}}
                onControlPointDragEnd={() => {}}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Simulation Button */}
            <button
              onClick={handleProceedToSimulation}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-3 rounded-xl flex items-center gap-3 transition-all font-bold shadow-xl text-base border-2 border-cyan-400"
            >
              <Settings className="w-5 h-5" />
              Start Simulation
            </button>

            {/* Optimization Button */}
            <button
              onClick={handleProceedToOptimization}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl flex items-center gap-3 transition-all font-bold shadow-xl text-base border-2 border-pink-400"
            >
              <ArrowRight className="w-5 h-5" />
              Optimize Design
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}
