'use client';

import { useState } from 'react';
import { Wind, Settings, Download, Save, LogOut, Sparkles, Play, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { AirfoilVisualizer } from './AirfoilVisualizer';

interface OptimizationPageProps {
  onBack: () => void;
  onLogout: () => void;
  initialUpperPoints: Array<{ id: number; value: number }>;
  initialLowerPoints: Array<{ id: number; value: number }>;
}

export function OptimizationPage({ onBack, onLogout, initialUpperPoints, initialLowerPoints }: OptimizationPageProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Optimization parameters
  const [objectiveFunction, setObjectiveFunction] = useState('maximize_ld');
  const [populationSize, setPopulationSize] = useState(50);
  const [maxGenerations, setMaxGenerations] = useState(100);
  const [mutationRate, setMutationRate] = useState(0.1);
  const [crossoverRate, setCrossoverRate] = useState(0.8);

  // Current airfoil being optimized (will change during optimization)
  const [upperControlPoints, setUpperControlPoints] = useState(initialUpperPoints);
  const [lowerControlPoints, setLowerControlPoints] = useState(initialLowerPoints);

  // Performance metrics
  const [currentCL, setCurrentCL] = useState(0);
  const [currentCD, setCurrentCD] = useState(0);
  const [currentLD, setCurrentLD] = useState(0);
  const [bestLD, setBestLD] = useState(0);

  const handleStartOptimization = () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    setCurrentIteration(0);
    setShowResults(false);

    // Simulate optimization process
    const interval = setInterval(() => {
      setOptimizationProgress((prev) => {
        const newProgress = prev + 1;
        setCurrentIteration(Math.floor(newProgress));

        // Simulate changing airfoil shape during optimization
        if (newProgress % 5 === 0) {
          // Slightly modify control points to simulate optimization
          setUpperControlPoints((points) =>
            points.map((p) => ({
              ...p,
              value: p.value + (Math.random() - 0.5) * 0.02,
            }))
          );
          setLowerControlPoints((points) =>
            points.map((p) => ({
              ...p,
              value: p.value + (Math.random() - 0.5) * 0.02,
            }))
          );

          // Update performance metrics
          setCurrentCL(1.2 + Math.random() * 0.3);
          setCurrentCD(0.015 + Math.random() * 0.01);
          setCurrentLD(60 + Math.random() * 20);
          setBestLD((prev) => Math.max(prev, 60 + Math.random() * 20));
        }

        if (newProgress >= maxGenerations) {
          clearInterval(interval);
          setIsOptimizing(false);
          setShowResults(true);
          return maxGenerations;
        }
        return newProgress;
      });
    }, 200);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Design"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Genetic Algorithm Optimization</h1>
                <p className="text-xs text-gray-500">Optimize airfoil for maximum performance</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Save className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Optimization Parameters */}
        <aside className="w-96 bg-white border-r border-gray-200 shadow-lg overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Optimization Settings */}
            {!isOptimizing && !showResults && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    Optimization Settings
                  </h3>

                  {/* Objective Function */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Objective Function
                    </label>
                    <select
                      value={objectiveFunction}
                      onChange={(e) => setObjectiveFunction(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                      <option value="maximize_ld">Maximize L/D Ratio</option>
                      <option value="maximize_cl">Maximize Lift Coefficient (CL)</option>
                      <option value="minimize_cd">Minimize Drag Coefficient (CD)</option>
                      <option value="minimize_cm">Minimize Moment Coefficient (CM)</option>
                      <option value="maximize_cl_cd">Maximize CL/CD at specific angle</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the aerodynamic parameter to optimize
                    </p>
                  </div>

                  {/* Population Size */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Population Size: <span className="text-orange-600 font-bold">{populationSize}</span>
                    </label>
                    <input
                      type="range"
                      min={20}
                      max={200}
                      step={10}
                      value={populationSize}
                      onChange={(e) => setPopulationSize(Number(e.target.value))}
                      className="w-full accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>20</span>
                      <span>200</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Number of individuals in each generation
                    </p>
                  </div>

                  {/* Max Generations */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Max Generations: <span className="text-orange-600 font-bold">{maxGenerations}</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={500}
                      step={10}
                      value={maxGenerations}
                      onChange={(e) => setMaxGenerations(Number(e.target.value))}
                      className="w-full accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10</span>
                      <span>500</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of iterations to run
                    </p>
                  </div>

                  {/* Mutation Rate */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Mutation Rate: <span className="text-orange-600 font-bold">{mutationRate.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      value={mutationRate}
                      onChange={(e) => setMutationRate(Number(e.target.value))}
                      className="w-full accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.01</span>
                      <span>0.50</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Probability of random changes to CST parameters
                    </p>
                  </div>

                  {/* Crossover Rate */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Crossover Rate: <span className="text-orange-600 font-bold">{crossoverRate.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={crossoverRate}
                      onChange={(e) => setCrossoverRate(Number(e.target.value))}
                      className="w-full accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.1</span>
                      <span>1.0</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Probability of combining parent solutions
                    </p>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartOptimization}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  <Play className="w-5 h-5" />
                  Start Optimization
                </button>

                {/* Info Box */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-orange-900 mb-2">ℹ️ How It Works</h4>
                  <ul className="text-xs text-orange-700 space-y-1">
                    <li>• Genetic algorithm optimizes CST parameters</li>
                    <li>• Airfoil shape evolves each generation</li>
                    <li>• CFD simulations evaluate fitness</li>
                    <li>• Best solutions are selected and bred</li>
                    <li>• Process continues until convergence</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Optimization Running */}
            {isOptimizing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Optimization Running...
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-orange-900">Progress</span>
                        <span className="font-bold text-orange-700">
                          {currentIteration} / {maxGenerations}
                        </span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
                          style={{ width: `${(optimizationProgress / maxGenerations) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-orange-700">
                      <p>⚡ Evaluating generation {currentIteration}</p>
                      <p>🧬 Evolving airfoil shape...</p>
                      <p>📊 Running CFD simulations...</p>
                    </div>
                  </div>
                </div>

                {/* Real-time Metrics */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-900">Current Generation Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lift Coeff. (CL):</span>
                      <span className="font-bold text-green-600">{currentCL.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Drag Coeff. (CD):</span>
                      <span className="font-bold text-blue-600">{currentCD.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">L/D Ratio:</span>
                      <span className="font-bold text-purple-600">{currentLD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 font-semibold">Best L/D So Far:</span>
                      <span className="font-bold text-orange-600">{bestLD.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Optimization Results */}
            {showResults && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2">
                    ✅ Optimization Complete!
                  </h3>
                  <p className="text-sm text-green-700">
                    Found optimal airfoil after {maxGenerations} generations
                  </p>
                </div>

                {/* Final Metrics */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-900">Optimized Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-green-50 rounded">
                      <span className="text-gray-700">Lift Coefficient (CL):</span>
                      <span className="font-bold text-green-600">1.45</span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-50 rounded">
                      <span className="text-gray-700">Drag Coefficient (CD):</span>
                      <span className="font-bold text-blue-600">0.0142</span>
                    </div>
                    <div className="flex justify-between p-2 bg-purple-50 rounded">
                      <span className="text-gray-700">L/D Ratio:</span>
                      <span className="font-bold text-purple-600">102.1</span>
                    </div>
                    <div className="flex justify-between p-2 bg-orange-50 rounded border-2 border-orange-300">
                      <span className="text-gray-700 font-semibold">Improvement:</span>
                      <span className="font-bold text-orange-600">+48.2%</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors">
                    Run Full Simulation
                  </button>
                  <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors">
                    Export Optimized Airfoil
                  </button>
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setOptimizationProgress(0);
                      setCurrentIteration(0);
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Run Another Optimization
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </aside>

        {/* Right: Airfoil Visualization */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="h-full p-6 flex flex-col">
            {/* Title */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {isOptimizing
                  ? 'Airfoil Evolving in Real-Time'
                  : showResults
                  ? 'Optimized Airfoil Shape'
                  : 'Initial Airfoil Configuration'}
              </h2>
              <p className="text-sm text-gray-600">
                {isOptimizing
                  ? 'Watch the airfoil shape change as the algorithm finds better solutions'
                  : showResults
                  ? 'Final optimized shape with maximum performance'
                  : 'This airfoil will be used as the starting point for optimization'}
              </p>
            </div>

            {/* Airfoil Visualization Card */}
            <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="h-full flex items-center justify-center relative">
                {/* Background effect during optimization */}
                {isOptimizing && (
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-transparent to-purple-50 rounded-lg opacity-50 animate-pulse" />
                )}

                <div className="w-full h-full relative z-10">
                  <AirfoilVisualizer
                    upperControlPoints={upperControlPoints}
                    lowerControlPoints={lowerControlPoints}
                    onUpdateControlPoint={() => {}}
                    showControlPoints={!isOptimizing}
                    showLabels={false}
                    fillAirfoil={true}
                  />
                </div>

                {/* Overlay text during optimization */}
                {isOptimizing && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Generation {currentIteration} / {maxGenerations}
                  </div>
                )}
              </div>
            </div>

            {/* CST Parameters Preview (if not optimizing) */}
            {!isOptimizing && (
              <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Active CST Parameters</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-blue-600 font-semibold">Upper Surface:</span>
                    <span className="text-gray-700 ml-2">{upperControlPoints.length} control points</span>
                  </div>
                  <div>
                    <span className="text-green-600 font-semibold">Lower Surface:</span>
                    <span className="text-gray-700 ml-2">{lowerControlPoints.length} control points</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
