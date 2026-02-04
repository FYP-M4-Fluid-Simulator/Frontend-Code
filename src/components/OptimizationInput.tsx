'use client';

import { TrendingUp, Target, Settings, Sliders } from 'lucide-react';
import { useState } from 'react';

interface OptimizationInputProps {
  onStartOptimization: () => void;
}

export function OptimizationInput({ onStartOptimization }: OptimizationInputProps) {
  const [maxIterations, setMaxIterations] = useState(50);
  const [populationSize, setPopulationSize] = useState(30);
  const [learningRate, setLearningRate] = useState(0.01);
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
                    Thickness Control Points
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    min={3}
                    max={10}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Camber Control Points
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    min={3}
                    max={10}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Algorithm Settings */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Algorithm Settings</h2>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Max Iterations: <span className="text-blue-600">{maxIterations}</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10</span>
                    <span>100</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Population Size: <span className="text-blue-600">{populationSize}</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={populationSize}
                    onChange={(e) => setPopulationSize(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10</span>
                    <span>100</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Learning Rate: <span className="text-blue-600">{learningRate.toFixed(3)}</span>
                  </label>
                  <input
                    type="range"
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    value={learningRate}
                    onChange={(e) => setLearningRate(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.001</span>
                    <span>0.1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Constraints */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Constraints</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Max Thickness (%): <span className="text-blue-600">{maxThickness}</span>
                  </label>
                  <input
                    type="range"
                    min={12}
                    max={25}
                    value={maxThickness}
                    onChange={(e) => setMaxThickness(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>12%</span>
                    <span>25%</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Min Thickness (%): <span className="text-blue-600">{minThickness}</span>
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={15}
                    value={minThickness}
                    onChange={(e) => setMinThickness(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>8%</span>
                    <span>15%</span>
                  </div>
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
