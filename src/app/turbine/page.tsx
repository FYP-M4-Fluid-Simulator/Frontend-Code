"use client";

import { useState, useEffect } from "react";
import {
  Wind,
  ArrowLeft,
  Download,
  Settings,
  RotateCcw,
  Maximize2,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { ProfessionalTurbine } from "../../components/ProfessionalTurbine";
import { useRouter } from "next/navigation";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

export default function TurbinePage() {
  const router = useRouter();

  // Turbine state
  const [turbineFullscreen, setTurbineFullscreen] = useState(false);
  const [liftToDragRatio, setLiftToDragRatio] = useState(45.0);

  // Load L/D ratio from sessionStorage if available
  useEffect(() => {
    const savedResults = sessionStorage.getItem("simulationResults");
    const savedOptResults = sessionStorage.getItem("optimizationResults");

    if (savedOptResults) {
      const results = JSON.parse(savedOptResults);
      setLiftToDragRatio(results.bestLiftToDragRatio || 66.6);
    } else if (savedResults) {
      const results = JSON.parse(savedResults);
      setLiftToDragRatio(results.liftToDragRatio || 36.5);
    }
  }, []);

  const handleResetView = () => {
    setTurbineFullscreen(false);
  };

  const handleExportResults = () => {
    const results = {
      liftToDragRatio,
      rpm: liftToDragRatio * 0.25,
      powerKw: liftToDragRatio * 3.2,
      efficiency: Math.min(98.5, (liftToDragRatio / 80) * 95),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turbine-performance-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Toolbar */}
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
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-gray-300 hover:border-blue-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-blue-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset View
          </button>

          <button
            onClick={handleExportResults}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-green-600"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>

          <button
            onClick={() => router.push("/simulate")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-cyan-50 border border-gray-300 hover:border-cyan-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-cyan-600"
          >
            <Settings className="w-3.5 h-3.5" />
            Run Simulation
          </button>

          <button
            onClick={() => router.push("/optimize")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 border border-gray-300 hover:border-orange-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-orange-600"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Optimize Design
          </button>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg">
            <Wind className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white tracking-wide">
              CFD AIRFOIL PLATFORM
            </span>
          </div>
          <div className="px-3 py-1 bg-green-100 rounded-lg border border-green-300">
            <span className="text-xs font-bold text-green-800">
              Turbine Visualization
            </span>
          </div>
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2">
          <UserProfileDropdown />
        </div>
      </div>

      {/* Main Content - Turbine Visualization */}
      <div className="flex-1 flex overflow-hidden relative bg-gradient-to-br from-gray-50 via-white to-green-50">
        {/* Performance Stats Overlay */}
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-green-300 p-5 min-w-[280px]">
            <h3 className="text-sm font-black text-green-900 mb-3 flex items-center gap-2">
              <Wind className="w-4 h-4" />
              Performance Summary
            </h3>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-gray-700">L/D Ratio:</span>
                <span className="font-black text-green-700">
                  {liftToDragRatio.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">RPM:</span>
                <span className="font-black text-blue-700">
                  {(liftToDragRatio * 0.25).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Power:</span>
                <span className="font-black text-orange-700">
                  {(liftToDragRatio * 3.2).toFixed(0)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Efficiency:</span>
                <span className="font-black text-purple-700">
                  {Math.min(98.5, (liftToDragRatio / 80) * 95).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Status:</span>
                <span className="font-black text-green-600">OPTIMAL</span>
              </div>
            </div>

            {/* Performance Rating */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs font-bold text-gray-700 mb-1">
                Performance Rating
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (liftToDragRatio / 80) * 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-xs font-black text-green-700">
                  {liftToDragRatio > 60
                    ? "EXCELLENT"
                    : liftToDragRatio > 40
                      ? "GOOD"
                      : "FAIR"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Toggle */}
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={() => setTurbineFullscreen(!turbineFullscreen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md hover:bg-white border border-gray-300 hover:border-green-400 rounded-lg transition-all text-xs font-bold shadow-lg"
          >
            <Maximize2 className="w-4 h-4" />
            <span>
              {turbineFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            </span>
          </button>
        </div>

        {/* Turbine Component */}
        <div className="flex-1 relative">
          <div className="absolute inset-4 rounded-xl shadow-2xl overflow-hidden border-2 border-gray-300">
            <ProfessionalTurbine
              liftToDragRatio={liftToDragRatio}
              isFullscreen={turbineFullscreen}
              onToggleFullscreen={() =>
                setTurbineFullscreen(!turbineFullscreen)
              }
            />
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-300 px-6 py-2">
            <div className="text-xs font-medium text-gray-700 text-center">
              Wind Turbine Performance Visualization • Real-time CFD Analysis
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
