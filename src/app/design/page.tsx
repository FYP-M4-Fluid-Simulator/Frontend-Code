"use client";

import { useState } from "react";
import { AirfoilCanvas } from "../../components/AirfoilCanvas";
import { FlowVisualization } from "../../components/FlowVisualization";
import { SimulationControls } from "../../components/SimulationControls";
import { MetricsModal } from "../../components/MetricsModal";
import { useAppContext } from "../providers";
import { BarChart3, Maximize2, Minimize2 } from "lucide-react";

export default function DesignPage() {
  const {
    isSimulating,
    setIsSimulating,
    simulationComplete,
    setSimulationComplete,
    showFlowField,
    setShowFlowField,
  } = useAppContext();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setShowFlowField(true);
    setSimulationComplete(false);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationComplete(true);
    }, 3000);
  };

  return (
    <>
      {/* Left Panel - Controls */}
      {!isFullscreen && (
        <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto">
          <SimulationControls
            isSimulating={isSimulating}
            onSimulate={handleSimulate}
          />
        </div>
      )}

      {/* Center - Visualization Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="flex-1 relative">
          {!showFlowField ? (
            <AirfoilCanvas />
          ) : (
            <FlowVisualization isSimulating={isSimulating} />
          )}

          {/* Fullscreen button overlay */}
          {!isFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}

          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Minimize2 className="w-4 h-4" />
              Exit Fullscreen
            </button>
          )}
        </div>

        {/* Bottom toolbar and metrics */}
        {!isFullscreen && (
          <div className="bg-gray-800 border-t border-gray-700">
            <div className="h-12 flex items-center px-4 gap-4 flex-wrap border-b border-gray-700">
              <button
                onClick={() => setShowFlowField(!showFlowField)}
                className="text-xs text-gray-300 hover:text-white px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
              >
                {showFlowField ? "Show Geometry" : "Show Flow Field"}
              </button>
              <div className="text-xs text-gray-400">
                Grid: 250×150 | Elements: 37,500 | CFL: 0.85
              </div>
            </div>

            {/* Metrics Panel */}
            {simulationComplete && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    Simulation Results
                  </h3>
                  <button
                    onClick={() => setShowMetricsModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-2"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    View Detailed Metrics
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-xs text-gray-400 mb-1">
                      Lift Coefficient
                    </div>
                    <div className="text-lg font-bold text-blue-400">1.198</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-xs text-gray-400 mb-1">
                      Drag Coefficient
                    </div>
                    <div className="text-lg font-bold text-red-400">0.0243</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-xs text-gray-400 mb-1">L/D Ratio</div>
                    <div className="text-lg font-bold text-green-400">49.3</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-xs text-gray-400 mb-1">
                      Moment Coeff.
                    </div>
                    <div className="text-lg font-bold text-purple-400">
                      -0.085
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metrics Modal */}
      <MetricsModal
        isOpen={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
      />
    </>
  );
}
