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
  ArrowRight,
  RotateCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveAirfoilCanvas } from '../../components/InteractiveAirfoilCanvas';
import { createSimulationConfig, downloadConfigFile } from '../../lib/exportData';
import { useRouter } from 'next/navigation';

export default function DesignPage() {
  const router = useRouter();
  const [showSimDesignerDropdown, setShowSimDesignerDropdown] = useState(false);
  const [showAirfoilDesignDropdown, setShowAirfoilDesignDropdown] = useState(false);
  
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
  const [showPressureField, setShowPressureField] = useState(false);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(true);
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

  const updateCSTCoefficient = async (surface: 'upper' | 'lower', index: number, value: number) => {
    if (surface === 'upper') {
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
      await fetch('/api/cst/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surface, index, value })
      });
    } catch (error) {
      console.log('API call would happen here:', { surface, index, value });
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

  const handleProceedToSimulator = () => {
    // Store state in sessionStorage for other pages
    sessionStorage.setItem('cfdState', JSON.stringify({
      upperCoefficients,
      lowerCoefficients,
      angleOfAttack,
      velocity,
      meshDensity
    }));
    router.push('/simulate');
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
            <RotateCw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button 
            onClick={handleSaveDesign}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-green-600 shadow-sm"
            style={{ boxShadow: '0 0 0 1px rgba(34, 197, 94, 0)' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 8px 2px rgba(34, 197, 94, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(34, 197, 94, 0)'}
          >
            <Save className="w-3.5 h-3.5" />
            Save Design
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 border border-gray-300 hover:border-purple-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-purple-600 shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Wind className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white tracking-wide">CFD AIRFOIL PLATFORM</span>
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded-lg border border-gray-300">
            <span className="text-xs font-bold text-gray-600">Design Mode</span>
          </div>
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-red-600 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

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

        {/* Visualization Controls - Top Center */}
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
              Wind Arrows
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-4">
          <div className="flex-1 flex gap-4">
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
                  designMode={true}
                />
              </div>
            </div>

            {/* Right Panel - Workflow Actions */}
            <div className="w-80 flex flex-col gap-4">
              {/* Workflow Stage Card */}
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-4">
                <div>
                  <h3 className="text-base font-black text-gray-900 mb-1">Design Workflow</h3>
                  <p className="text-xs text-gray-600 font-medium">Configure airfoil geometry and flow parameters</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleProceedToSimulator}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-black shadow-xl text-base border-2 border-cyan-400"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Proceed to Simulation
                  </button>
                </div>
              </div>

              {/* Info Panel */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-5 space-y-3">
                <h4 className="text-sm font-black text-blue-900">📐 Current Configuration</h4>
                <div className="space-y-2 text-xs font-medium text-blue-800">
                  <div className="flex justify-between">
                    <span>Upper Coefficients:</span>
                    <span className="font-black">{upperCoefficients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lower Coefficients:</span>
                    <span className="font-black">{lowerCoefficients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flow Velocity:</span>
                    <span className="font-black">{velocity} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Angle of Attack:</span>
                    <span className="font-black">{angleOfAttack}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mesh Quality:</span>
                    <span className="font-black capitalize">{meshDensity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
