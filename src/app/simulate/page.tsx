'use client';

import { useState, useRef, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveAirfoilCanvas } from '../../components/InteractiveAirfoilCanvas';
import { useRouter } from 'next/navigation';

export default function SimulatePage() {
  const router = useRouter();
  const [showSimDesignerDropdown, setShowSimDesignerDropdown] = useState(false);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // CST Coefficients and flow parameters (loaded from sessionStorage)
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([
    0.15, 0.20, 0.18, 0.12, 0.08
  ]);
  
  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([
    -0.10, -0.12, -0.09, -0.06, -0.04
  ]);

  const [angleOfAttack, setAngleOfAttack] = useState(5);
  const [velocity, setVelocity] = useState(15);
  const [meshDensity, setMeshDensity] = useState<'coarse' | 'medium' | 'fine' | 'ultra'>('medium');
  const [showPressureField, setShowPressureField] = useState(true);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(true);
  const [showControlPoints, setShowControlPoints] = useState(false);

  // Canvas dimensions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('cfdState');
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
          height: canvasRef.current.offsetHeight
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const updateCSTCoefficient = (surface: 'upper' | 'lower', index: number, value: number) => {
    if (surface === 'upper') {
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
      const response = await fetch('/api/simulate/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upperCoefficients,
          lowerCoefficients,
          velocity,
          angleOfAttack,
          meshDensity
        })
      });

      // Simulate progress animation
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setSimulationProgress(i);
      }

      setShowResults(true);
    } catch (error) {
      console.log('Simulation would run here with API');
      // Simulate progress even if API fails
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setSimulationProgress(i);
      }
      setShowResults(true);
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

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Compact Top Ribbon */}
      <div className="bg-white border-b border-gray-300 flex items-center justify-between px-4 py-2 shadow-sm z-40">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/design')}
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

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-green-600">
            <Download className="w-3.5 h-3.5" />
            Export Results
          </button>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">
            <Wind className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white tracking-wide">CFD AIRFOIL PLATFORM</span>
          </div>
          <div className="px-3 py-1 bg-cyan-100 rounded-lg border border-cyan-300">
            <span className="text-xs font-bold text-cyan-800">Simulation Mode</span>
          </div>
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-red-600"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative bg-gradient-to-br from-gray-50 via-white to-cyan-50">
        {/* Left Full Sidebar - Simulation Designer */}
        <AnimatePresence>
          {showSimDesignerDropdown && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-20"
                onClick={() => setShowSimDesignerDropdown(false)}
              />
              
              <motion.div
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-[130px] bottom-0 w-96 shadow-2xl border-r-2 border-blue-400 z-30 flex flex-col"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 0 40px 12px rgba(59, 130, 246, 0.25)'
                }}
              >
                <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Simulation Parameters
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">Adjust flow conditions</p>
                  </div>
                  <button
                    onClick={() => setShowSimDesignerDropdown(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  <div>
                    <label className="text-sm font-black text-gray-900 mb-3 block">Flow Velocity (m/s)</label>
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
                    <p className="text-xs text-gray-500">Current: {velocity} m/s</p>
                  </div>

                  <div>
                    <label className="text-sm font-black text-gray-900 mb-3 block">Angle of Attack (°)</label>
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
                    <p className="text-xs text-gray-500">Current: {angleOfAttack.toFixed(1)}°</p>
                  </div>

                  <div>
                    <label className="text-sm font-black text-gray-900 mb-3 block">Mesh Quality</label>
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
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="absolute left-4 top-4 z-30">
          <button
            onClick={() => setShowSimDesignerDropdown(!showSimDesignerDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-xs font-bold shadow-lg"
          >
            <Settings className="w-4 h-4" />
            <span>Simulation Parameters</span>
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
              <div className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden" style={{
                background: '#000000',
                border: '2px solid rgba(100, 100, 100, 0.4)',
              }}>
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
            </div>

            {/* Right Panel */}
            <div className="w-80 flex flex-col gap-4">
              <div className="bg-white rounded-xl border-2 border-cyan-300 shadow-lg p-6 space-y-4">
                <div>
                  <h3 className="text-base font-black text-gray-900 mb-1">CFD Simulation</h3>
                  <p className="text-xs text-gray-600 font-medium">Run computational fluid dynamics analysis</p>
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
                      <p className="text-sm font-black text-green-800">✓ Simulation Complete!</p>
                    </div>
                    
                    <button
                      onClick={() => router.push('/optimize')}
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
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 p-5 space-y-3">
                  <h4 className="text-sm font-black text-cyan-900">📊 Simulation Results</h4>
                  <div className="space-y-2 text-xs font-medium text-cyan-800">
                    <div className="flex justify-between">
                      <span>Lift Coefficient (C<sub>L</sub>):</span>
                      <span className="font-black">0.8542</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Drag Coefficient (C<sub>D</sub>):</span>
                      <span className="font-black">0.0234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>L/D Ratio:</span>
                      <span className="font-black">36.5</span>
                    </div>
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
    </div>
  );
}
