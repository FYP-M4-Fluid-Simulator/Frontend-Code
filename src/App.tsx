import { useState } from "react";
import { AirfoilCanvas } from "./components/AirfoilCanvas";
import { FlowVisualization } from "./components/FlowVisualization";
import { SimulationControls } from "./components/SimulationControls";
import { TopBar } from "./components/TopBar";
import { ProfessionalTurbine } from "./components/ProfessionalTurbine";
import { OptimizationInput } from "./components/OptimizationInput";
import { OptimizationResults } from "./components/OptimizationResults";
import { OptimizationAnimation } from "./components/OptimizationAnimation";
import { MetricsModal } from "./components/MetricsModal";
import { AuthModal } from "./components/AuthModal";
import { SavedDesignsModal } from "./components/SavedDesignsModal";
import { ProfileModal } from "./components/ProfileModal";
import { BarChart3, Maximize2, Minimize2 } from "lucide-react";

export default function App() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showFlowField, setShowFlowField] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "design" | "optimize" | "turbine"
  >("design");
  const [liftToDragRatio, setLiftToDragRatio] = useState(49.3);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  // Auth and user state
  const [user, setUser] = useState<{ email: string; name: string } | null>(
    null,
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavedDesigns, setShowSavedDesigns] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleStartOptimization = () => {
    setIsOptimizing(true);
    setOptimizationComplete(false);
  };

  const handleOptimizationComplete = () => {
    setIsOptimizing(false);
    setOptimizationComplete(true);
    setLiftToDragRatio(87.3);
  };

  const handleResetOptimization = () => {
    setOptimizationComplete(false);
    setIsOptimizing(false);
  };

  const handleLogin = (email: string, name: string) => {
    setUser({ email, name });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      <TopBar
        selectedTab={selectedTab}
        onTabChange={(tab) => {
          setSelectedTab(tab);
          setIsFullscreen(false);
        }}
        isSimulating={isSimulating}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenSavedDesigns={() => setShowSavedDesigns(true)}
        onOpenProfile={() => setShowProfile(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Turbine View */}
        {selectedTab === "turbine" && (
          <div className="flex-1 flex flex-col lg:flex-row">
            <ProfessionalTurbine
              liftToDragRatio={liftToDragRatio}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
            {!isFullscreen && (
              <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 overflow-y-auto">
                <h2 className="font-semibold text-gray-900 mb-4">
                  Turbine Performance
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-700 block mb-2">
                      Lift-to-Drag Ratio: {liftToDragRatio.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={0.1}
                      value={liftToDragRatio}
                      onChange={(e) =>
                        setLiftToDragRatio(Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded p-3">
                      <div className="text-xs text-gray-600 mb-1">
                        Rotation Speed
                      </div>
                      <div className="font-semibold text-lg text-blue-700">
                        {(liftToDragRatio * 0.12).toFixed(1)} RPM
                      </div>
                    </div>
                    <div className="bg-green-50 rounded p-3">
                      <div className="text-xs text-gray-600 mb-1">
                        Power Output
                      </div>
                      <div className="font-semibold text-lg text-green-700">
                        {(liftToDragRatio * 2.5).toFixed(0)} kW
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <div className="text-xs text-gray-600 mb-1">
                        Efficiency
                      </div>
                      <div className="font-semibold text-lg text-purple-700">
                        {Math.min(95, (liftToDragRatio / 100) * 95).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded p-3">
                      <div className="text-xs text-gray-600 mb-1">
                        Tip Speed
                      </div>
                      <div className="font-semibold text-lg text-orange-700">
                        {(liftToDragRatio * 0.8).toFixed(1)} m/s
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2"></h3>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Rotor Diameter:</span>
                        <span className="font-medium text-gray-900">40 m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Blade Length:</span>
                        <span className="font-medium text-gray-900">
                          19.5 m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number of Blades:</span>
                        <span className="font-medium text-gray-900">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wind Speed:</span>
                        <span className="font-medium text-gray-900">
                          12 m/s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optimization View */}
        {selectedTab === "optimize" && (
          <>
            {!isOptimizing && !optimizationComplete ? (
              <OptimizationInput
                onStartOptimization={handleStartOptimization}
              />
            ) : isOptimizing ? (
              <OptimizationAnimation onComplete={handleOptimizationComplete} />
            ) : (
              <OptimizationResults
                onReset={handleResetOptimization}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            )}
          </>
        )}

        {/* Design View */}
        {selectedTab === "design" && (
          <>
            {/* Left Panel - Controls */}
            {!isFullscreen && (
              <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto">
                <SimulationControls
                  isSimulating={isSimulating}
                  onSimulate={() => {
                    setIsSimulating(true);
                    setShowFlowField(true);
                    setSimulationComplete(false);
                    setTimeout(() => {
                      setIsSimulating(false);
                      setSimulationComplete(true);
                    }, 3000);
                  }}
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
                          <div className="text-lg font-bold text-blue-400">
                            1.198
                          </div>
                        </div>
                        <div className="bg-gray-700 rounded p-3">
                          <div className="text-xs text-gray-400 mb-1">
                            Drag Coefficient
                          </div>
                          <div className="text-lg font-bold text-red-400">
                            0.0243
                          </div>
                        </div>
                        <div className="bg-gray-700 rounded p-3">
                          <div className="text-xs text-gray-400 mb-1">
                            L/D Ratio
                          </div>
                          <div className="text-lg font-bold text-green-400">
                            49.3
                          </div>
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
          </>
        )}
      </div>

      {/* Metrics Modal */}
      <MetricsModal
        isOpen={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      {/* Saved Designs Modal */}
      <SavedDesignsModal
        isOpen={showSavedDesigns}
        onClose={() => setShowSavedDesigns(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />
    </div>
  );
}
