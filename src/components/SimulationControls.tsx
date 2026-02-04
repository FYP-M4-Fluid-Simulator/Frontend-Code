'use client';

import { Play, Upload, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SimulationControlsProps {
  isSimulating: boolean;
  onSimulate: () => void;
}

interface ControlPoint {
  id: number;
  value: number;
}

export function SimulationControls({ isSimulating, onSimulate }: SimulationControlsProps) {
  const [angleOfAttack, setAngleOfAttack] = useState(5);
  const [velocity, setVelocity] = useState(15);
  const [refinementLevel, setRefinementLevel] = useState('medium');
  const [airfoilSource, setAirfoilSource] = useState<'select' | 'upload'>('select');
  const [selectedAirfoil, setSelectedAirfoil] = useState('NACA 4412');
  const [showControlPoints, setShowControlPoints] = useState(false);
  
  const [upperControlPoints, setUpperControlPoints] = useState<ControlPoint[]>([
    { id: 1, value: 0.15 },
    { id: 2, value: 0.20 },
    { id: 3, value: 0.18 },
    { id: 4, value: 0.12 },
    { id: 5, value: 0.08 },
  ]);
  
  const [lowerControlPoints, setLowerControlPoints] = useState<ControlPoint[]>([
    { id: 1, value: -0.10 },
    { id: 2, value: -0.12 },
    { id: 3, value: -0.09 },
    { id: 4, value: -0.06 },
    { id: 5, value: -0.04 },
  ]);

  const addControlPoint = (surface: 'upper' | 'lower') => {
    if (surface === 'upper') {
      const newId = Math.max(...upperControlPoints.map(p => p.id), 0) + 1;
      setUpperControlPoints([...upperControlPoints, { id: newId, value: 0.10 }]);
    } else {
      const newId = Math.max(...lowerControlPoints.map(p => p.id), 0) + 1;
      setLowerControlPoints([...lowerControlPoints, { id: newId, value: -0.05 }]);
    }
  };

  const removeControlPoint = (surface: 'upper' | 'lower', id: number) => {
    if (surface === 'upper' && upperControlPoints.length > 2) {
      setUpperControlPoints(upperControlPoints.filter(p => p.id !== id));
    } else if (surface === 'lower' && lowerControlPoints.length > 2) {
      setLowerControlPoints(lowerControlPoints.filter(p => p.id !== id));
    }
  };

  const updateControlPoint = (surface: 'upper' | 'lower', id: number, value: number) => {
    if (surface === 'upper') {
      setUpperControlPoints(upperControlPoints.map(p => 
        p.id === id ? { ...p, value } : p
      ));
    } else {
      setLowerControlPoints(lowerControlPoints.map(p => 
        p.id === id ? { ...p, value } : p
      ));
    }
  };

  return (
    <div className="p-4 space-y-6 max-h-screen overflow-y-auto">
      {/* Airfoil Selection/Upload */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Airfoil Configuration</h2>
        
        {/* Source Selection */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setAirfoilSource('select')}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              airfoilSource === 'select'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Select Airfoil
          </button>
          <button
            onClick={() => setAirfoilSource('upload')}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              airfoilSource === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upload Airfoil
          </button>
        </div>

        {/* Select Airfoil */}
        {airfoilSource === 'select' && (
          <div>
            <label className="text-sm text-gray-700 block mb-2">Choose Airfoil Profile</label>
            <select 
              value={selectedAirfoil}
              onChange={(e) => setSelectedAirfoil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>NACA 4412</option>
              <option>NACA 0012</option>
              <option>NACA 2412</option>
              <option>NACA 6409</option>
              <option>S809 (Wind Turbine)</option>
              <option>Clark Y</option>
              <option>Eppler 387</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Will be converted to CST parameterization
            </p>
          </div>
        )}

        {/* Upload Airfoil */}
        {airfoilSource === 'upload' && (
          <div>
            <label className="text-sm text-gray-700 block mb-2">Upload Coordinate File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">DAT, TXT, or CSV format</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Airfoil coordinates will be automatically converted to CST format
            </p>
          </div>
        )}
      </div>

      {/* CST Control Points */}
      <div className="border-t border-gray-200 pt-6">
        <div 
          onClick={() => setShowControlPoints(!showControlPoints)}
          className="flex items-center justify-between cursor-pointer mb-4"
        >
          <h2 className="font-semibold text-gray-900">CST Control Points</h2>
          {showControlPoints ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {showControlPoints && (
          <div className="space-y-4">
            {/* Upper Surface */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Upper Surface</label>
                <button
                  onClick={() => addControlPoint('upper')}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Point
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded p-2">
                {upperControlPoints.map((point, index) => (
                  <div key={point.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12">CP {index + 1}:</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={-0.5}
                          max={0.5}
                          step={0.01}
                          value={point.value}
                          onChange={(e) => updateControlPoint('upper', point.id, Number(e.target.value))}
                          className="flex-1 accent-blue-600"
                        />
                        <span className="text-xs font-medium text-blue-600 w-14 text-right">
                          {point.value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeControlPoint('upper', point.id)}
                      disabled={upperControlPoints.length <= 2}
                      className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {upperControlPoints.length} control points
              </p>
            </div>

            {/* Lower Surface */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Lower Surface</label>
                <button
                  onClick={() => addControlPoint('lower')}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Point
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded p-2">
                {lowerControlPoints.map((point, index) => (
                  <div key={point.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12">CP {index + 1}:</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={-0.5}
                          max={0.5}
                          step={0.01}
                          value={point.value}
                          onChange={(e) => updateControlPoint('lower', point.id, Number(e.target.value))}
                          className="flex-1 accent-blue-600"
                        />
                        <span className="text-xs font-medium text-blue-600 w-14 text-right">
                          {point.value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeControlPoint('lower', point.id)}
                      disabled={lowerControlPoints.length <= 2}
                      className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lowerControlPoints.length} control points
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Flow Conditions */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="font-semibold text-gray-900 mb-4">Flow Conditions</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 block mb-2">
              Velocity: <span className="text-blue-600 font-medium">{velocity} m/s</span>
            </label>
            <input
              type="range"
              min={5}
              max={100}
              step={1}
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 m/s</span>
              <span>100 m/s</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-2">
              Angle of Attack: <span className="text-blue-600 font-medium">{angleOfAttack}°</span>
            </label>
            <input
              type="range"
              min={-10}
              max={20}
              step={0.5}
              value={angleOfAttack}
              onChange={(e) => setAngleOfAttack(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-10°</span>
              <span>20°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mesh Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="font-semibold text-gray-900 mb-4">Mesh Settings</h2>
        <div>
          <label className="text-sm text-gray-700 block mb-2">Refinement Level</label>
          <select 
            value={refinementLevel}
            onChange={(e) => setRefinementLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="coarse">Coarse (Fast, ~15k cells)</option>
            <option value="medium">Medium (Balanced, ~40k cells)</option>
            <option value="fine">Fine (Accurate, ~100k cells)</option>
            <option value="very-fine">Very Fine (High accuracy, ~250k cells)</option>
          </select>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={onSimulate}
        disabled={isSimulating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-lg hover:shadow-xl"
      >
        <Play className="w-5 h-5" />
        {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
      </button>
    </div>
  );
}