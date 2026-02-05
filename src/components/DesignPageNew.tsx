'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Wind, 
  Settings, 
  Download, 
  Save, 
  LogOut, 
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  FilePlus,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Ruler,
  User,
  Cpu,
  Clock,
  ArrowRight,
  RotateCw,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveAirfoilCanvas } from './InteractiveAirfoilCanvas';
import { createSimulationConfig, downloadConfigFile } from '@/lib/exportData';

interface DesignPageProps {
  onLogout: () => void;
}

type WorkflowStage = 'design' | 'simulator' | 'simulate' | 'optimize';

export function DesignPage({ onLogout }: DesignPageProps) {
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('design');
  const [showSimDesignerDropdown, setShowSimDesignerDropdown] = useState(false);
  const [showAirfoilDesignDropdown, setShowAirfoilDesignDropdown] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationIteration, setOptimizationIteration] = useState(0);

  // CST Coefficients
  const [upperCoefficients, setUpperCoefficients] = useState<number[]>([
    0.15, 0.20, 0.18, 0.12, 0.08
  ]);
  
  const [lowerCoefficients, setLowerCoefficients] = useState<number[]>([
    -0.10, -0.12, -0.09, -0.06, -0.04
  ]);

  // Flow parameters  
  const [angleOfAttack, setAngleOfAttack] = useState(5);
  const [velocity, setVelocity] = useState(15);
  const [meshDensity, setMeshDensity] = useState<'coarse' | 'medium' | 'fine' | 'ultra'>('medium');
  const [showPressureField, setShowPressureField] = useState(true);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(false);
  const [showControlPoints, setShowControlPoints] = useState(true);

  // Canvas dimensions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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

  const handleSaveDesign = () => {
    const config = createSimulationConfig(
      upperCoefficients,
      lowerCoefficients,
      velocity,
      angleOfAttack,
      meshDensity
    );
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    downloadConfigFile(config, `airfoil-design-${timestamp}.json`);
  };

  const handleResetDesign = () => {
    setUpperCoefficients([0.15, 0.20, 0.18, 0.12, 0.08]);
    setLowerCoefficients([-0.10, -0.12, -0.09, -0.06, -0.04]);
    setAngleOfAttack(5);
    setVelocity(15);
  };

  const addCSTCoefficient = (surface: 'upper' | 'lower') => {
    if (surface === 'upper') {
      setUpperCoefficients([...upperCoefficients, 0.05]);
    } else {
      setLowerCoefficients([...lowerCoefficients, -0.05]);
    }
  };

  const removeCSTCoefficient = (surface: 'upper' | 'lower', index: number) => {
    if (surface === 'upper' && upperCoefficients.length > 2) {
      setUpperCoefficients(upperCoefficients.filter((_, i) => i !== index));
    } else if (surface === 'lower' && lowerCoefficients.length > 2) {
      setLowerCoefficients(lowerCoefficients.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Compact Top Ribbon */}
      <div className="bg-white border-b border-gray-300 flex items-center justify-between px-4 py-2 shadow-sm z-40">
        {/* Left: Project Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleResetDesign}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-gray-300 hover:border-blue-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-blue-600 shadow-sm"
            style={{ boxShadow: '0 0 0 1px rgba(59, 130, 246, 0)' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 8px 2px rgba(59, 130, 246, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0)'}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>New Simulation</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-gray-300 hover:border-blue-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-blue-600 shadow-sm"
            style={{ boxShadow: '0 0 0 1px rgba(59, 130, 246, 0)' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 8px 2px rgba(59, 130, 246, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0)'}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Import .dat</span>
          </button>
        </div>

        {/* Center: Canvas Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-300">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 3))}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <div className="px-2 text-xs font-semibold text-gray-700 min-w-[50px] text-center">
              {(zoomLevel * 100).toFixed(0)}%
            </div>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.3))}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          <button className="p-1.5 hover:bg-gray-100 rounded border border-gray-300 transition-colors" title="Reload View">
            <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded border border-gray-300 transition-colors" title="Measure">
            <Ruler className="w-3.5 h-3.5 text-gray-600" />
          </button>

          {/* Mesh Options Dropdown */}
          <select
            value={meshDensity}
            onChange={(e) => setMeshDensity(e.target.value as any)}
            className="px-2 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
          >
            <option value="coarse">Coarse Mesh</option>
            <option value="medium">Medium Mesh</option>
            <option value="fine">Fine Mesh</option>
            <option value="ultra">Refined Mesh</option>
          </select>
        </div>

        {/* Right: Account + Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDesign}
            className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
            title="Save Design"
          >
            <Save className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={onLogout} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Account">
            <User className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-md z-30">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Wind className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">AeroSim CFD</h1>
              <p className="text-xs text-gray-500 font-medium">
                {workflowStage === 'design' && 'Design Mode'}
                {workflowStage === 'simulator' && 'Wind Turbine Simulator'}
                {workflowStage === 'simulate' && 'CFD Simulation'}
                {workflowStage === 'optimize' && 'Genetic Optimization'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative bg-gradient-to-br from-gray-50 via-white to-blue-50">
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
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-[130px] bottom-0 w-96 shadow-2xl border-r-2 border-blue-400 z-30 flex flex-col"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 0 40px 12px rgba(59, 130, 246, 0.25)'
                }}
              >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Simulation Designer
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">Flow & simulation parameters</p>
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

                  {/* Angle of Attack */}
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

                  <div className="border-t-2 border-gray-200 pt-6">
                    <h4 className="text-sm font-black text-gray-900 mb-4">Time-Step Configuration</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 block">Start Time (s)</label>
                        <input type="number" defaultValue={0} step={0.1} className="w-full px-3 py-2 text-sm border border-gray-300 rounded" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 block">End Time (s)</label>
                        <input type="number" defaultValue={10} step={0.5} className="w-full px-3 py-2 text-sm border border-gray-300 rounded" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 block">Time Step Δt (s)</label>
                        <input type="number" defaultValue={0.001} step={0.0001} className="w-full px-3 py-2 text-sm border border-gray-300 rounded" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 block">CPU Cores</label>
                        <select defaultValue={4} className="w-full px-3 py-2 text-sm border border-gray-300 rounded">
                          <option value={1}>1 Core</option>
                          <option value={2}>2 Cores</option>
                          <option value={4}>4 Cores</option>
                          <option value={8}>8 Cores</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="text-xs font-black text-blue-900 mb-2">ℹ️ Computational Estimate</h4>
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
            style={{ boxShadow: '0 0 0 1px rgba(147, 51, 234, 0)' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 12px 3px rgba(147, 51, 234, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(147, 51, 234, 0)'}
          >
            <Settings className="w-4 h-4" />
            <span>Simulation Designer</span>
          </button>
        </div>

        {/* Right Full Sidebar - Airfoil Design (CST Coefficients) */}
        {workflowStage === 'design' && (
          <>
            <AnimatePresence>
              {showAirfoilDesignDropdown && (
                <>
                  {/* Overlay - more transparent to see through */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-20"
                    onClick={() => setShowAirfoilDesignDropdown(false)}
                  />
                  
                  {/* Sidebar - Semi-transparent with glassmorphism */}
                  <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed right-0 top-[130px] bottom-0 w-96 shadow-2xl border-l-2 border-green-400 z-30 flex flex-col"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      boxShadow: '0 0 40px 12px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <Wind className="w-5 h-5" />
                          Airfoil Design
                        </h3>
                        <p className="text-xs text-green-100 mt-0.5">CST parametrization coefficients</p>
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
                          <h4 className="text-sm font-black text-blue-700">Upper Surface (A<sub>u</sub>)</h4>
                          <button
                            onClick={() => addCSTCoefficient('upper')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {upperCoefficients.map((coeff, index) => (
                            <div key={`upper-${index}`} className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-700 w-14">A<sub>u,{index}</sub></span>
                              <input
                                type="range"
                                min={-0.5}
                                max={0.5}
                                step={0.01}
                                value={coeff}
                                onChange={(e) => updateCSTCoefficient('upper', index, Number(e.target.value))}
                                className="flex-1 h-2 accent-blue-600"
                              />
                              <input
                                type="number"
                                value={coeff.toFixed(3)}
                                onChange={(e) => updateCSTCoefficient('upper', index, Number(e.target.value))}
                                className="w-24 px-2 py-1.5 text-sm border border-blue-300 rounded font-mono"
                              />
                              <button
                                onClick={() => removeCSTCoefficient('upper', index)}
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
                          <h4 className="text-sm font-black text-green-700">Lower Surface (A<sub>l</sub>)</h4>
                          <button
                            onClick={() => addCSTCoefficient('lower')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {lowerCoefficients.map((coeff, index) => (
                            <div key={`lower-${index}`} className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-700 w-14">A<sub>l,{index}</sub></span>
                              <input
                                type="range"
                                min={-0.5}
                                max={0.5}
                                step={0.01}
                                value={coeff}
                                onChange={(e) => updateCSTCoefficient('lower', index, Number(e.target.value))}
                                className="flex-1 h-2 accent-green-600"
                              />
                              <input
                                type="number"
                                value={coeff.toFixed(3)}
                                onChange={(e) => updateCSTCoefficient('lower', index, Number(e.target.value))}
                                className="w-24 px-2 py-1.5 text-sm border border-green-300 rounded font-mono"
                              />
                              <button
                                onClick={() => removeCSTCoefficient('lower', index)}
                                disabled={lowerCoefficients.length <= 2}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                        <h4 className="text-xs font-black text-green-900 mb-2">💡 CST Parameterization</h4>
                        <p className="text-xs text-green-800 font-medium">
                          Class Shape Transformation uses Bernstein polynomials to define airfoil geometry. Adjust coefficients to modify curvature.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Right Sidebar Trigger Button */}
            <div className="absolute right-4 top-4 z-30">
              <button
                onClick={() => setShowAirfoilDesignDropdown(!showAirfoilDesignDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all text-xs font-bold shadow-lg"
                style={{ boxShadow: '0 0 0 1px rgba(16, 185, 129, 0)' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 12px 3px rgba(16, 185, 129, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(16, 185, 129, 0)'}
              >
                <Wind className="w-4 h-4" />
                <span>Airfoil Design</span>
              </button>
            </div>
          </>
        )}

        {/* Canvas Area */}
        <div className="flex-1 p-4 relative">
          <div className="h-full flex flex-col">
            {/* Canvas Controls - Checkboxes at top */}
            <div className="mb-3 flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPressureField}
                  onChange={(e) => setShowPressureField(e.target.checked)}
                  className="w-4 h-4"
                />
                Pressure Field
              </label>
              
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVectorField}
                  onChange={(e) => setShowVectorField(e.target.checked)}
                  className="w-4 h-4"
                />
                Vector Field
              </label>
              
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMeshOverlay}
                  onChange={(e) => setShowMeshOverlay(e.target.checked)}
                  className="w-4 h-4"
                />
                Mesh Overlay
              </label>
              
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showControlPoints}
                  onChange={(e) => setShowControlPoints(e.target.checked)}
                  className="w-4 h-4"
                />
                Control Points
              </label>
            </div>

            {/* Main Canvas */}
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
                  designMode={workflowStage === 'design'}
                />
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-4">
              {workflowStage === 'design' && (
                <button
                  onClick={() => setWorkflowStage('simulator')}
                  className="w-full bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-black shadow-xl text-base border-2 border-green-400"
                  style={{ boxShadow: '0 0 0 1px rgba(16, 185, 129, 0)' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 16px 4px rgba(16, 185, 129, 0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(16, 185, 129, 0)'}
                >
                  <ArrowRight className="w-5 h-5" />
                  Next: Finalize Design & Enter Simulator
                </button>
              )}

              {workflowStage === 'simulator' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setWorkflowStage('design')}
                    className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg text-sm border-2 border-gray-400"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Design Mode
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setWorkflowStage('simulate')}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base border-2 border-cyan-400"
                    >
                      <Play className="w-5 h-5" />
                      Run CFD Simulation
                    </button>
                    
                    <button
                      onClick={() => setWorkflowStage('optimize')}
                      className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base border-2 border-orange-400"
                    >
                      <Sparkles className="w-5 h-5" />
                      Start Optimization
                    </button>
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