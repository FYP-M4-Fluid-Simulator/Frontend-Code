import { RotateCcw, Maximize2, Minimize2, Download, ArrowRight, BarChart3 } from 'lucide-react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { AirfoilCanvas } from './AirfoilCanvas';
import { useState } from 'react';

interface OptimizationResultsProps {
  onReset: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function OptimizationResults({ onReset, isFullscreen, onToggleFullscreen }: OptimizationResultsProps) {
  const [showGraphs, setShowGraphs] = useState(false);

  // Mock optimization results data
  const convergenceData = [
    { iteration: 0, fitness: 45.2, best: 45.2 },
    { iteration: 5, fitness: 52.3, best: 52.3 },
    { iteration: 10, fitness: 61.5, best: 61.5 },
    { iteration: 15, fitness: 58.2, best: 61.5 },
    { iteration: 20, fitness: 69.8, best: 69.8 },
    { iteration: 25, fitness: 75.2, best: 75.2 },
    { iteration: 30, fitness: 73.1, best: 75.2 },
    { iteration: 35, fitness: 81.4, best: 81.4 },
    { iteration: 40, fitness: 84.7, best: 84.7 },
    { iteration: 45, fitness: 86.2, best: 86.2 },
    { iteration: 50, fitness: 87.3, best: 87.3 },
  ];

  const cpDistribution = [
    { x: 0, cpUpper: 1.0, cpLower: 0.8 },
    { x: 0.05, cpUpper: -1.8, cpLower: 0.4 },
    { x: 0.1, cpUpper: -2.5, cpLower: 0.6 },
    { x: 0.2, cpUpper: -2.8, cpLower: 0.5 },
    { x: 0.3, cpUpper: -2.5, cpLower: 0.4 },
    { x: 0.4, cpUpper: -2.0, cpLower: 0.3 },
    { x: 0.5, cpUpper: -1.5, cpLower: 0.2 },
    { x: 0.6, cpUpper: -1.1, cpLower: 0.1 },
    { x: 0.7, cpUpper: -0.7, cpLower: 0.05 },
    { x: 0.8, cpUpper: -0.4, cpLower: 0.02 },
    { x: 0.9, cpUpper: -0.2, cpLower: 0.0 },
    { x: 1.0, cpUpper: 0.0, cpLower: 0.0 },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-1">✓ Optimization Complete!</h2>
            <p className="text-green-50 text-sm">
              Achieved 93% improvement in lift-to-drag ratio
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGraphs(!showGraphs)}
              className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              {showGraphs ? 'Hide' : 'Show'} Graphs
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              New Optimization
            </button>
            <button className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-xs text-gray-600 mb-1">L/D Ratio</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">87.3</div>
              <div className="text-xs text-green-600 mt-1">+93% improvement</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="text-xs text-gray-600 mb-1">Lift Coefficient</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">1.452</div>
              <div className="text-xs text-blue-600 mt-1">+21% increase</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="text-xs text-gray-600 mb-1">Drag Coefficient</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">0.0166</div>
              <div className="text-xs text-red-600 mt-1">-32% reduction</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <div className="text-xs text-gray-600 mb-1">Iterations</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">50</div>
              <div className="text-xs text-purple-600 mt-1">Converged</div>
            </div>
          </div>

          {/* Airfoil Comparison */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Optimized Airfoil Shape</h3>
              <button
                onClick={onToggleFullscreen}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
            <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'bg-gray-900'}`}>
              <AirfoilCanvas />
              {isFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="absolute top-4 right-4 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Minimize2 className="w-4 h-4" />
                  Exit Fullscreen
                </button>
              )}
            </div>
          </div>

          {!isFullscreen && (
            <>
              {/* Before/After Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Original Design</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profile:</span>
                      <span className="font-medium">NACA 4412</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thickness:</span>
                      <span className="font-medium">12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Camber:</span>
                      <span className="font-medium">4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">L/D Ratio:</span>
                      <span className="font-medium">45.2</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-4 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Optimized Design</h3>
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Best</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profile:</span>
                      <span className="font-medium">Custom Optimized</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thickness:</span>
                      <span className="font-medium">14.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Camber:</span>
                      <span className="font-medium">5.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">L/D Ratio:</span>
                      <span className="font-medium text-green-700">87.3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Grid - Only show when showGraphs is true */}
              {showGraphs && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Convergence History */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Optimization Convergence</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={convergenceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="iteration" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} label={{ value: 'L/D Ratio', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="fitness" 
                            stroke="#94a3b8" 
                            strokeWidth={2}
                            dot={false}
                            name="Current"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="best" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={false}
                            name="Best"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pressure Distribution */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Pressure Coefficient Distribution</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={cpDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="x" 
                            tick={{ fontSize: 11 }}
                            label={{ value: 'x/c', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 11 }}
                            reversed
                            label={{ value: 'Cp', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="cpUpper" 
                            stroke="#3b82f6" 
                            fill="#93c5fd" 
                            name="Upper Surface"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cpLower" 
                            stroke="#ef4444" 
                            fill="#fca5a5" 
                            name="Lower Surface"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Design Parameters */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Optimized Design Parameters</h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Leading Edge Radius</div>
                        <div className="text-lg font-semibold text-gray-900">1.42%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '71%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Max Thickness Position</div>
                        <div className="text-lg font-semibold text-gray-900">32.5%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Trailing Edge Angle</div>
                        <div className="text-lg font-semibold text-gray-900">11.8°</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '54%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Camber Position</div>
                        <div className="text-lg font-semibold text-gray-900">38%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-orange-600 h-2 rounded-full" style={{ width: '38%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Surface Smoothness</div>
                        <div className="text-lg font-semibold text-gray-900">0.9982</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-teal-600 h-2 rounded-full" style={{ width: '99.8%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Stall Margin</div>
                        <div className="text-lg font-semibold text-gray-900">18.5°</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: '92.5%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Next Steps */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  Next Steps
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Your optimized airfoil design is ready! View the performance in the Wind Turbine simulator or export the geometry for manufacturing.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    View in Turbine Simulator
                  </button>
                  <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Export CAD File
                  </button>
                  <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Generate Report
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}