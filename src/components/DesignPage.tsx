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
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
  PanelLeftClose,
  PanelRightClose,
  Check,
  RotateCw,
  Maximize2,
  FilePlus,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Ruler,
  User,
  Cpu,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicAirfoilSVG } from './DynamicAirfoilSVG';
import { GridSimulationCanvas } from './GridSimulationCanvas';
import { EulerianFlowCanvas } from './EulerianFlowCanvas';
import { InteractiveAirfoilCanvas } from './InteractiveAirfoilCanvas';
import { generateAirfoil } from '@/lib/cst';
import { createSimulationConfig, downloadConfigFile } from '@/lib/exportData';

interface DesignPageProps {
  onLogout: () => void;
}

type PageMode = 'design' | 'simulate' | 'optimize';
type WorkflowStage = 'drafting' | 'simulator';

export function DesignPage({ onLogout }: DesignPageProps) {
  const [pageMode, setPageMode] = useState<PageMode>('design');
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('drafting');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [showSimDesignerModal, setShowSimDesignerModal] = useState(false);
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
  const [previousAirfoil, setPreviousAirfoil] = useState<{upper: number[], lower: number[]} | null>(null);

  // CST Coefficients (these are the A_u and A_l parameters)
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

  // Optimization parameters
  const [targetLiftDrag, setTargetLiftDrag] = useState(70);
  const [thicknessConstraint, setThicknessConstraint] = useState(0.12);
  const [maxIterations, setMaxIterations] = useState(100);

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
  }, [leftSidebarOpen, rightSidebarOpen]);

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

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setShowResults(false);

    const interval = setInterval(() => {
      setSimulationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          setShowResults(true);
          return 100;
        }
        return prev + 2;
      });
    }, 80);
  };

  const handleStartOptimization = () => {
    setPreviousAirfoil({
      upper: [...upperCoefficients],
      lower: [...lowerCoefficients]
    });
    setIsOptimizing(true);
    setOptimizationIteration(0);

    const interval = setInterval(() => {
      setOptimizationIteration((prev) => {
        if (prev >= maxIterations) {
          clearInterval(interval);
          setIsOptimizing(false);
          return maxIterations;
        }

        // Simulate optimization by slightly modifying coefficients
        setUpperCoefficients(coeffs => 
          coeffs.map(c => c + (Math.random() - 0.5) * 0.01)
        );
        setLowerCoefficients(coeffs => 
          coeffs.map(c => c + (Math.random() - 0.5) * 0.01)
        );

        return prev + 1;
      });
    }, 100);
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
      const newCoeffs = upperCoefficients.filter((_, i) => i !== index);
      setUpperCoefficients(newCoeffs);
    } else if (surface === 'lower' && lowerCoefficients.length > 2) {
      const newCoeffs = lowerCoefficients.filter((_, i) => i !== index);
      setLowerCoefficients(newCoeffs);
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

          {/* Simulation Designer Button */}
          <button
            onClick={() => setShowSimDesignerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-xs font-bold shadow-md"
            style={{ boxShadow: '0 0 0 1px rgba(147, 51, 234, 0)' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 12px 3px rgba(147, 51, 234, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(147, 51, 234, 0)'}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Simulation Designer</span>
          </button>
        </div>

        {/* Right: Account */}
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Account">
          <User className="w-4 h-4 text-gray-600" />
        </button>
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
              <p className="text-xs text-gray-500 font-medium">CST-Based Airfoil Design & Optimization</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 border-2 border-gray-200">
              <button
                onClick={() => setPageMode('design')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  pageMode === 'design'
                    ? 'bg-white text-cyan-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Design
              </button>
              <button
                onClick={() => {
                  setPageMode('simulate');
                  setShowResults(false);
                }}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                  pageMode === 'simulate'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Play className="w-4 h-4" />
                Simulate
              </button>
              <button
                onClick={() => setPageMode('optimize')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                  pageMode === 'optimize'
                    ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Optimize
              </button>
            </div>

            <div className="w-px h-8 bg-gray-300" />
            
            <button
              onClick={handleResetDesign}
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Reset Design"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleSaveDesign}
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Save Design"
            >
              <Save className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            <div className="w-px h-8 bg-gray-300" />
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Flow & Geometry Controls */}
        <AnimatePresence>
          {leftSidebarOpen && (
            <motion.aside
              initial={{ x: -380 }}
              animate={{ x: 0 }}
              exit={{ x: -380 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="w-96 bg-white border-r-2 border-gray-200 shadow-2xl overflow-y-auto relative"
            >
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white hover:bg-gray-100 rounded-xl shadow-lg transition-all border-2 border-gray-300 hover:border-cyan-400"
              >
                <PanelLeftClose className="w-4 h-4 text-gray-700" />
              </button>

              <div className="p-6 space-y-6 pt-16">
                <div className="text-center pb-4 border-b-2 border-gray-200">
                  <h2 className="text-xl font-black text-gray-900">Flow Parameters</h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Control simulation conditions</p>
                </div>

                {/* Velocity Slider */}
                <div className="bg-gradient-to-br from-cyan-50 via-cyan-100 to-blue-100 rounded-2xl p-5 border-2 border-cyan-300 shadow-lg">
                  <label className="text-sm font-black text-gray-900 mb-3 block flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-lg" />
                    Flow Velocity
                  </label>
                  <div className="mb-4 text-center bg-white/60 rounded-xl py-3 px-4 backdrop-blur-sm border border-cyan-200">
                    <div className="text-5xl font-black text-cyan-600">{velocity}</div>
                    <div className="text-sm text-cyan-700 font-bold">m/s</div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={velocity}
                    onChange={(e) => setVelocity(Number(e.target.value))}
                    className="w-full h-3 accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-cyan-700 mt-2 font-bold">
                    <span>5 m/s</span>
                    <span>100 m/s</span>
                  </div>
                  <div className="mt-3 bg-white/80 rounded-lg px-3 py-2 text-xs text-cyan-900 font-semibold border border-cyan-200">
                    <strong>Reynolds:</strong> ~{Math.floor(velocity * 10000).toLocaleString()}
                  </div>
                </div>

                {/* Angle of Attack */}
                <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 rounded-2xl p-5 border-2 border-purple-300 shadow-lg">
                  <label className="text-sm font-black text-gray-900 mb-3 block flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg" />
                    Angle of Attack (α)
                  </label>
                  <div className="mb-4 text-center bg-white/60 rounded-xl py-3 px-4 backdrop-blur-sm border border-purple-200">
                    <div className="text-5xl font-black text-purple-600">{angleOfAttack.toFixed(1)}°</div>
                    <div className="text-sm text-purple-700 font-bold">degrees</div>
                  </div>
                  <input
                    type="range"
                    min={-15}
                    max={25}
                    step={0.5}
                    value={angleOfAttack}
                    onChange={(e) => setAngleOfAttack(Number(e.target.value))}
                    className="w-full h-3 accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-purple-700 mt-2 font-bold">
                    <span>-15°</span>
                    <span>25°</span>
                  </div>
                  <div className="mt-3 bg-white/80 rounded-lg px-3 py-2 text-xs text-purple-900 font-semibold border border-purple-200">
                    Real-time rotation applied to airfoil
                  </div>
                </div>

                {/* Mesh Density */}
                <div className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 rounded-2xl p-5 border-2 border-green-300 shadow-lg">
                  <label className="text-sm font-black text-gray-900 mb-3 block flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                    Grid Mesh Density
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'coarse' as const, label: 'Coarse', desc: '~5k nodes', color: 'border-green-300' },
                      { value: 'medium' as const, label: 'Medium', desc: '~15k nodes', color: 'border-blue-300' },
                      { value: 'fine' as const, label: 'Fine', desc: '~40k nodes', color: 'border-purple-300' },
                      { value: 'ultra' as const, label: 'Ultra Fine', desc: '~100k nodes', color: 'border-orange-300' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          meshDensity === option.value
                            ? `bg-white shadow-lg scale-105 ${option.color}`
                            : 'bg-white/50 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="mesh"
                            value={option.value}
                            checked={meshDensity === option.value}
                            onChange={(e) => setMeshDensity(e.target.value as any)}
                            className="w-5 h-5"
                          />
                          <div>
                            <div className="text-sm font-black text-gray-900">{option.label}</div>
                            <div className="text-xs text-gray-600 font-medium">{option.desc}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pressure Field */}
                <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 rounded-2xl p-5 border-2 border-blue-300 shadow-lg">
                  <label className="text-sm font-black text-gray-900 mb-3 block flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg" />
                    Show Pressure Field
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showPressureField}
                      onChange={(e) => setShowPressureField(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div className="text-sm text-gray-700 font-medium">Enable Pressure Field</div>
                  </div>
                </div>

                {/* Vector Field */}
                <div className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 rounded-2xl p-5 border-2 border-green-300 shadow-lg">
                  <label className="text-sm font-black text-gray-900 mb-3 block flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                    Show Vector Field
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showVectorField}
                      onChange={(e) => setShowVectorField(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div className="text-sm text-gray-700 font-medium">Enable Vector Field</div>
                  </div>
                </div>

                {/* Mesh Overlay */}
                <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-300 rounded-2xl p-5 border-2 border-gray-300 shadow-lg">
                  <label className="text-sm font-black text-gray-900 mb-3 block flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse shadow-lg" />
                    Show Mesh Overlay
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showMeshOverlay}
                      onChange={(e) => setShowMeshOverlay(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div className="text-sm text-gray-700 font-medium">Enable Mesh Overlay</div>
                  </div>
                </div>

                {/* Control Points */}
                <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-300 rounded-2xl p-5 border-2 border-gray-300 shadow-lg">
                  <label className="text-sm font-black text-gray-900 mb-3 block flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse shadow-lg" />
                    Show Control Points
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showControlPoints}
                      onChange={(e) => setShowControlPoints(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div className="text-sm text-gray-700 font-medium">Enable Control Points</div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {!leftSidebarOpen && (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white hover:bg-cyan-50 rounded-xl shadow-2xl transition-all border-2 border-cyan-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-cyan-600" />
          </button>
        )}

        {/* Center: Main Visualization Canvas */}
        <main className="flex-1 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden relative">
          <div className="h-full flex flex-col">
            {/* Info Banner */}
            {pageMode === 'design' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="m-6 mb-4 bg-white rounded-2xl p-4 shadow-xl border-2 border-cyan-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Wind className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 text-lg">CST Airfoil Designer</h3>
                    <p className="text-sm text-gray-600 font-medium">
                      Adjust CST coefficients (A<sub>u</sub>, A<sub>l</sub>) in real-time. Airfoil geometry updates via Bernstein polynomials.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Canvas Area */}
            <div className="flex-1 mx-6 mb-4 relative" ref={canvasRef}>
              <div className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden" style={{
                background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF5E8 50%, #FFE8D5 100%)',
                border: '3px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 20px 60px rgba(59, 130, 246, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)'
              }}>
                {/* Interactive Airfoil Canvas with CFD */}
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
                />

                {/* Ghost airfoil overlay in optimize mode */}
                {pageMode === 'optimize' && previousAirfoil && (
                  <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.2 }}>
                    <InteractiveAirfoilCanvas
                      width={canvasSize.width}
                      height={canvasSize.height}
                      upperCoefficients={previousAirfoil.upper}
                      lowerCoefficients={previousAirfoil.lower}
                      angleOfAttack={angleOfAttack}
                      velocity={velocity}
                      meshQuality={meshDensity}
                      showControlPoints={false}
                      showMeshOverlay={false}
                      showPressureField={false}
                      showVectorField={false}
                      onCoefficientChange={() => {}}
                      allowFullScreen={false}
                    />
                  </div>
                )}

                {/* Status Overlays */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg border-2 border-cyan-400">
                    Velocity: {velocity} m/s
                  </div>
                  <div className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg border-2 border-purple-400">
                    AoA: {angleOfAttack.toFixed(1)}°
                  </div>
                  <div className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg border-2 border-green-400 capitalize">
                    {meshDensity} Mesh
                  </div>
                </div>

                {/* Simulation Progress */}
                {isSimulating && (
                  <div className="absolute top-4 right-4 bg-white rounded-xl p-4 shadow-2xl border-2 border-blue-300">
                    <div className="text-sm font-bold text-gray-700 mb-2">Simulation Progress</div>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${simulationProgress}%` }}
                        />
                      </div>
                      <span className="text-lg font-black text-blue-600">{simulationProgress}%</span>
                    </div>
                  </div>
                )}

                {/* Optimization Status */}
                {isOptimizing && (
                  <div className="absolute top-4 right-4 bg-white rounded-xl p-4 shadow-2xl border-2 border-orange-300">
                    <div className="text-sm font-bold text-gray-700 mb-2">Optimization Running</div>
                    <div className="text-2xl font-black text-orange-600">
                      Iteration: {optimizationIteration} / {maxIterations}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mx-6 mb-6">
              {pageMode === 'design' && (
                <button
                  onClick={() => setPageMode('simulate')}
                  className="w-full bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black shadow-2xl hover:shadow-green-500/50 text-lg border-2 border-green-400"
                >
                  <Check className="w-6 h-6" />
                  Finalize Design & Enter Wind Turbine Simulator
                </button>
              )}

              {pageMode === 'simulate' && !isSimulating && !showResults && (
                <button
                  onClick={handleStartSimulation}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black shadow-2xl text-lg border-2 border-cyan-400"
                >
                  <Play className="w-6 h-6" />
                  Start CFD Simulation
                </button>
              )}

              {pageMode === 'optimize' && !isOptimizing && (
                <button
                  onClick={handleStartOptimization}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black shadow-2xl text-lg border-2 border-orange-400"
                >
                  <Sparkles className="w-6 h-6" />
                  Start Genetic Algorithm Optimization
                </button>
              )}

              {showResults && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-300">
                    <div className="text-xs text-gray-600 font-bold mb-1">Lift Coefficient</div>
                    <div className="text-3xl font-black text-green-600">1.24</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-300">
                    <div className="text-xs text-gray-600 font-bold mb-1">Drag Coefficient</div>
                    <div className="text-3xl font-black text-blue-600">0.018</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-300">
                    <div className="text-xs text-gray-600 font-bold mb-1">L/D Ratio</div>
                    <div className="text-3xl font-black text-purple-600">68.9</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-orange-300">
                    <div className="text-xs text-gray-600 font-bold mb-1">Power Output</div>
                    <div className="text-3xl font-black text-orange-600">2.4kW</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar - CST Coefficients */}
        <AnimatePresence>
          {rightSidebarOpen && (
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="w-[420px] bg-white border-l-2 border-gray-200 shadow-2xl overflow-y-auto relative"
            >
              <button
                onClick={() => setRightSidebarOpen(false)}
                className="absolute top-4 left-4 z-10 p-2 bg-white hover:bg-gray-100 rounded-xl shadow-lg transition-all border-2 border-gray-300 hover:border-purple-400"
              >
                <PanelRightClose className="w-4 h-4 text-gray-700" />
              </button>

              <div className="p-6 space-y-6 pt-16">
                <div className="text-center pb-4 border-b-2 border-gray-200">
                  <h2 className="text-xl font-black text-gray-900">
                    {pageMode === 'optimize' ? 'Optimization Parameters' : 'CST Coefficients'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {pageMode === 'optimize' ? 'Target metrics & constraints' : 'Bernstein polynomial weights'}
                  </p>
                </div>

                {pageMode === 'optimize' ? (
                  // Optimization Parameters
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-5 border-2 border-orange-300">
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Target L/D Ratio
                      </label>
                      <div className="text-3xl font-black text-orange-600 text-center mb-3">{targetLiftDrag}</div>
                      <input
                        type="range"
                        min={20}
                        max={150}
                        value={targetLiftDrag}
                        onChange={(e) => setTargetLiftDrag(Number(e.target.value))}
                        className="w-full h-3 accent-orange-500"
                      />
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-300">
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Thickness Constraint
                      </label>
                      <div className="text-3xl font-black text-purple-600 text-center mb-3">{(thicknessConstraint * 100).toFixed(1)}%</div>
                      <input
                        type="range"
                        min={0.08}
                        max={0.20}
                        step={0.01}
                        value={thicknessConstraint}
                        onChange={(e) => setThicknessConstraint(Number(e.target.value))}
                        className="w-full h-3 accent-purple-500"
                      />
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-300">
                      <label className="text-sm font-black text-gray-900 mb-3 block">
                        Max Iterations
                      </label>
                      <div className="text-3xl font-black text-blue-600 text-center mb-3">{maxIterations}</div>
                      <input
                        type="range"
                        min={10}
                        max={500}
                        step={10}
                        value={maxIterations}
                        onChange={(e) => setMaxIterations(Number(e.target.value))}
                        className="w-full h-3 accent-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  // CST Coefficients
                  <>
                    {/* Upper Surface A_u */}
                    <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 rounded-2xl p-4 border-2 border-blue-300 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg" />
                          Upper Surface (A<sub>u</sub>)
                        </h3>
                        <button
                          onClick={() => addCSTCoefficient('upper')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-md font-bold"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {upperCoefficients.map((coeff, index) => (
                          <div key={`upper-${index}`} className="bg-white rounded-xl p-3 border-2 border-blue-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-blue-700">
                                A<sub>u,{index}</sub>
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={-0.5}
                                  max={0.5}
                                  step={0.01}
                                  value={coeff.toFixed(3)}
                                  onChange={(e) => updateCSTCoefficient('upper', index, Number(e.target.value))}
                                  className="w-24 px-2 py-1 text-xs border-2 border-blue-300 rounded-lg font-mono text-blue-900 focus:ring-2 focus:ring-blue-500 font-bold"
                                />
                                <button
                                  onClick={() => removeCSTCoefficient('upper', index)}
                                  disabled={upperCoefficients.length <= 2}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={-0.5}
                              max={0.5}
                              step={0.01}
                              value={coeff}
                              onChange={(e) => updateCSTCoefficient('upper', index, Number(e.target.value))}
                              className="w-full h-2 accent-blue-600"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-600 font-semibold">
                        {upperCoefficients.length} coefficients (min: 2)
                      </div>
                    </div>

                    {/* Lower Surface A_l */}
                    <div className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 rounded-2xl p-4 border-2 border-green-300 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg" />
                          Lower Surface (A<sub>l</sub>)
                        </h3>
                        <button
                          onClick={() => addCSTCoefficient('lower')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all shadow-md font-bold"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {lowerCoefficients.map((coeff, index) => (
                          <div key={`lower-${index}`} className="bg-white rounded-xl p-3 border-2 border-green-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-green-700">
                                A<sub>l,{index}</sub>
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={-0.5}
                                  max={0.5}
                                  step={0.01}
                                  value={coeff.toFixed(3)}
                                  onChange={(e) => updateCSTCoefficient('lower', index, Number(e.target.value))}
                                  className="w-24 px-2 py-1 text-xs border-2 border-green-300 rounded-lg font-mono text-green-900 focus:ring-2 focus:ring-green-500 font-bold"
                                />
                                <button
                                  onClick={() => removeCSTCoefficient('lower', index)}
                                  disabled={lowerCoefficients.length <= 2}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={-0.5}
                              max={0.5}
                              step={0.01}
                              value={coeff}
                              onChange={(e) => updateCSTCoefficient('lower', index, Number(e.target.value))}
                              className="w-full h-2 accent-green-600"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-600 font-semibold">
                        {lowerCoefficients.length} coefficients (min: 2)
                      </div>
                    </div>

                    {/* Info */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                      <h4 className="text-xs font-black text-purple-900 mb-2">💡 CST Methodology</h4>
                      <ul className="text-xs text-purple-700 space-y-1 font-medium">
                        <li>• Bernstein polynomial basis</li>
                        <li>• Real-time SVG rendering</li>
                        <li>• Adjust sliders or type values</li>
                        <li>• Add/remove coefficients</li>
                        <li>• Instant geometry update</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {!rightSidebarOpen && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white hover:bg-purple-50 rounded-xl shadow-2xl transition-all border-2 border-purple-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-purple-600" />
          </button>
        )}
      </div>

      {/* Simulation Designer Modal */}
      <AnimatePresence>
        {showSimDesignerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowSimDesignerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-blue-300"
              style={{ boxShadow: '0 0 40px 10px rgba(59, 130, 246, 0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Settings className="w-7 h-7" />
                  Simulation Designer
                </h2>
                <p className="text-sm text-blue-100 mt-1 font-medium">Configure time-step parameters and computational resources</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Start Time */}
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Start Time (s)
                    </label>
                  </div>
                  <input
                    type="number"
                    defaultValue={0}
                    step={0.1}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* End Time */}
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      End Time (s)
                    </label>
                  </div>
                  <input
                    type="number"
                    defaultValue={10}
                    step={0.5}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Time Step */}
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" />
                      Time Step Δt (s)
                    </label>
                  </div>
                  <input
                    type="number"
                    defaultValue={0.001}
                    step={0.0001}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Save Steps */}
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <Save className="w-3.5 h-3.5 text-green-600" />
                      Save Every N Steps
                    </label>
                  </div>
                  <input
                    type="number"
                    defaultValue={100}
                    step={10}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* CPU Cores */}
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-orange-600" />
                      CPU Cores
                    </label>
                  </div>
                  <select
                    defaultValue={4}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value={1}>1 Core</option>
                    <option value={2}>2 Cores</option>
                    <option value={4}>4 Cores</option>
                    <option value={8}>8 Cores</option>
                    <option value={16}>16 Cores</option>
                  </select>
                </div>

                {/* Info Panel */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-4">
                  <h4 className="text-xs font-black text-blue-900 mb-2">ℹ️ Computational Estimate</h4>
                  <ul className="text-xs text-blue-800 space-y-1 font-semibold">
                    <li>• Total Steps: ~10,000</li>
                    <li>• Est. Runtime: 2.5 minutes (4 cores)</li>
                    <li>• Output Size: ~850 MB</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowSimDesignerModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSimDesignerModal(false)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-xl transition-all shadow-lg text-sm"
                  style={{ boxShadow: '0 0 0 1px rgba(147, 51, 234, 0)' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 16px 4px rgba(147, 51, 234, 0.6)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(147, 51, 234, 0)'}
                >
                  Apply Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}