'use client';

import { X } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MetricsModal({ isOpen, onClose }: MetricsModalProps) {
  if (!isOpen) return null;

  const convergenceData = [
    { iteration: 0, residual: 1.0, cl: 0.4, cd: 0.08 },
    { iteration: 50, residual: 0.5, cl: 0.75, cd: 0.045 },
    { iteration: 100, residual: 0.1, cl: 1.02, cd: 0.032 },
    { iteration: 150, residual: 0.05, cl: 1.15, cd: 0.028 },
    { iteration: 200, residual: 0.01, cl: 1.18, cd: 0.026 },
    { iteration: 250, residual: 0.005, cl: 1.19, cd: 0.025 },
    { iteration: 300, residual: 0.001, cl: 1.195, cd: 0.0245 },
    { iteration: 350, residual: 0.0005, cl: 1.198, cd: 0.0243 },
  ];

  const polarData = [
    { alpha: -5, cl: 0.2, cd: 0.015 },
    { alpha: 0, cl: 0.65, cd: 0.018 },
    { alpha: 5, cl: 1.195, cd: 0.024 },
    { alpha: 10, cl: 1.52, cd: 0.035 },
    { alpha: 15, cl: 1.68, cd: 0.055 },
    { alpha: 20, cl: 1.55, cd: 0.095 },
  ];

  const cpDistribution = [
    { x: 0, cpUpper: 0.8, cpLower: -0.2 },
    { x: 0.05, cpUpper: -1.2, cpLower: 0.3 },
    { x: 0.1, cpUpper: -1.8, cpLower: 0.5 },
    { x: 0.2, cpUpper: -2.1, cpLower: 0.4 },
    { x: 0.3, cpUpper: -1.9, cpLower: 0.3 },
    { x: 0.4, cpUpper: -1.5, cpLower: 0.2 },
    { x: 0.5, cpUpper: -1.1, cpLower: 0.1 },
    { x: 0.6, cpUpper: -0.8, cpLower: 0.05 },
    { x: 0.7, cpUpper: -0.5, cpLower: 0.02 },
    { x: 0.8, cpUpper: -0.3, cpLower: 0.01 },
    { x: 0.9, cpUpper: -0.15, cpLower: 0.0 },
    { x: 1.0, cpUpper: 0.0, cpLower: 0.0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Detailed Simulation Metrics</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Performance Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="text-xs text-gray-600 mb-1">Lift Coefficient</div>
                <div className="text-2xl font-bold text-blue-700">1.198</div>
                <div className="text-xs text-gray-600 mt-1">C<sub>L</sub></div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                <div className="text-xs text-gray-600 mb-1">Drag Coefficient</div>
                <div className="text-2xl font-bold text-red-700">0.0243</div>
                <div className="text-xs text-gray-600 mt-1">C<sub>D</sub></div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="text-xs text-gray-600 mb-1">L/D Ratio</div>
                <div className="text-2xl font-bold text-green-700">49.3</div>
                <div className="text-xs text-gray-600 mt-1">Aerodynamic Efficiency</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="text-xs text-gray-600 mb-1">Moment Coefficient</div>
                <div className="text-2xl font-bold text-purple-700">-0.085</div>
                <div className="text-xs text-gray-600 mt-1">C<sub>M</sub></div>
              </div>
            </div>
          </div>

          {/* Flow Properties */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Flow Properties</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Velocity:</span>
                    <span className="font-medium text-gray-900">18.7 m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Pressure:</span>
                    <span className="font-medium text-gray-900">-142 Pa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Pressure:</span>
                    <span className="font-medium text-gray-900">89 Pa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Separation Point:</span>
                    <span className="font-medium text-green-600">None</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stagnation Point:</span>
                    <span className="font-medium text-gray-900">x/c = 0.02</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transition Point:</span>
                    <span className="font-medium text-gray-900">x/c = 0.15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Turbulence Intensity:</span>
                    <span className="font-medium text-gray-900">2.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wall Shear Stress:</span>
                    <span className="font-medium text-gray-900">1.24 Pa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Convergence History */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Convergence History</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={convergenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="iteration" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Iteration', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    scale="log"
                    domain={[0.0001, 1]}
                    label={{ value: 'Residual', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="residual" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cp Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Pressure Coefficient Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={cpDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="x" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'x/c', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Cp', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    reversed
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area 
                    type="monotone" 
                    dataKey="cpUpper" 
                    stroke="#3b82f6" 
                    fill="#93c5fd" 
                    name="Upper"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cpLower" 
                    stroke="#ef4444" 
                    fill="#fca5a5" 
                    name="Lower"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Lift Polar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Lift Polar</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={polarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="alpha" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Angle of Attack (°)', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'C_L', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="cl" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Drag Polar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Drag Polar</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={polarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="cd" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'C_D', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'C_L', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="cl" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mesh and Solver Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mesh Information</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cells:</span>
                  <span className="font-medium text-gray-900">37,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Cell Size:</span>
                  <span className="font-medium text-gray-900">0.0001 m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Cell Size:</span>
                  <span className="font-medium text-gray-900">0.025 m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Boundary Layers:</span>
                  <span className="font-medium text-gray-900">20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">y+ (avg):</span>
                  <span className="font-medium text-gray-900">1.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mesh Quality:</span>
                  <span className="font-medium text-green-600">Excellent</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Solver Settings</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Solver:</span>
                  <span className="font-medium text-gray-900">SIMPLE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Turbulence Model:</span>
                  <span className="font-medium text-gray-900">k-ω SST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Step:</span>
                  <span className="font-medium text-gray-900">0.001 s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Iterations:</span>
                  <span className="font-medium text-gray-900">350</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Convergence Time:</span>
                  <span className="font-medium text-gray-900">2.35 s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Converged</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}