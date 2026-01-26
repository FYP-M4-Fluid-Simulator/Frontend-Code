import { TrendingUp, Target, Settings, Sliders } from 'lucide-react';
import { useState } from 'react';

interface OptimizationInputProps {
  onStartOptimization: () => void;
}

export function OptimizationInput({ onStartOptimization }: OptimizationInputProps) {
  const [maxIterations, setMaxIterations] = useState(50);
  const [populationSize, setPopulationSize] = useState(30);
  const [maxThickness, setMaxThickness] = useState(18);
  const [minThickness, setMinThickness] = useState(10);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Airfoil Shape Optimization
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Configure optimization parameters and objectives to find the best airfoil design
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
            
            {/* Objectives Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Optimization Objectives</h2>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Maximize C<sub>L</sub></span>
                </label>
                <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Minimize C<sub>D</sub></span>
                </label>
                <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Maximize L/D</span>
                </label>
                <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Target C<sub>M</sub></span>
                </label>
              </div>
            </div>

            {/* Design Variables */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Design Variables</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Leading Edge Radius
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      defaultValue={0.5}
                      step={0.1}
                      placeholder="Min"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      defaultValue={2.0}
                      step={0.1}
                      placeholder="Max"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Max Thickness Position (%)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      defaultValue={25}
                      placeholder="Min %"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      defaultValue={40}
                      placeholder="Max %"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Trailing Edge Angle (°)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      defaultValue={8}
                      placeholder="Min"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      defaultValue={15}
                      placeholder="Max"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Camber Control Points
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Algorithm Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Algorithm Settings</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Optimization Method
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Genetic Algorithm</option>
                    <option>Particle Swarm</option>
                    <option>Gradient Descent</option>
                    <option>Adjoint Method</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Max Iterations: {maxIterations}
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Population Size: {populationSize}
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    value={populationSize}
                    onChange={(e) => setPopulationSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Convergence Tolerance
                  </label>
                  <input
                    type="number"
                    defaultValue={0.001}
                    step={0.0001}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Constraints */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Constraints</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Max Thickness (%): {maxThickness}
                  </label>
                  <input
                    type="range"
                    min={12}
                    max={25}
                    value={maxThickness}
                    onChange={(e) => setMaxThickness(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Min Thickness (%): {minThickness}
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={15}
                    value={minThickness}
                    onChange={(e) => setMinThickness(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Enforce smoothness</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Prevent separation</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Structural feasibility</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="bg-gray-50 px-6 md:px-8 py-6 border-t border-gray-200">
            <button
              onClick={onStartOptimization}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
            >
              <TrendingUp className="w-6 h-6" />
              Start Optimization
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">
              Estimated time: ~10 seconds for {maxIterations} iterations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
