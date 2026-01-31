'use client';

import { Play, Settings } from 'lucide-react';
import { useState } from 'react';

interface SimulationControlsProps {
  isSimulating: boolean;
  onSimulate: () => void;
}

export function SimulationControls({ isSimulating, onSimulate }: SimulationControlsProps) {
  const [angleOfAttack, setAngleOfAttack] = useState(5);
  const [velocity, setVelocity] = useState(15);
  const [reynolds, setReynolds] = useState(500000);

  return (
    <div className="p-4 space-y-6 max-h-screen overflow-y-auto">
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Airfoil Parameters</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 block mb-1">Profile Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>NACA 4412</option>
              <option>NACA 0012</option>
              <option>S809 (Wind Turbine)</option>
              <option>Custom</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">Chord Length (m)</label>
            <input
              type="number"
              defaultValue={1.0}
              step={0.1}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-2">Thickness: 12%</label>
            <input
              type="range"
              min={8}
              max={25}
              defaultValue={12}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-2">Camber: 4%</label>
            <input
              type="range"
              min={0}
              max={8}
              defaultValue={4}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="font-semibold text-gray-900 mb-4">Flow Conditions</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 block mb-2">
              Angle of Attack: {angleOfAttack}°
            </label>
            <input
              type="range"
              min={-10}
              max={20}
              value={angleOfAttack}
              onChange={(e) => setAngleOfAttack(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">
              Velocity (m/s)
            </label>
            <input
              type="number"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">
              Reynolds Number
            </label>
            <input
              type="number"
              value={reynolds}
              onChange={(e) => setReynolds(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">Turbulence Model</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>k-ω SST</option>
              <option>Spalart-Allmaras</option>
              <option>k-ε Realizable</option>
              <option>Laminar</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="font-semibold text-gray-900 mb-4">Mesh Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 block mb-1">Refinement Level</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Coarse</option>
              <option selected>Medium</option>
              <option>Fine</option>
              <option>Very Fine</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">Boundary Layer</label>
            <input
              type="number"
              defaultValue={20}
              placeholder="Number of layers"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Total Cells:</span>
              <span className="font-medium">37,500</span>
            </div>
            <div className="flex justify-between">
              <span>Min Cell Size:</span>
              <span className="font-medium">0.0001 m</span>
            </div>
            <div className="flex justify-between">
              <span>y+ (avg):</span>
              <span className="font-medium">1.2</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onSimulate}
        disabled={isSimulating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded flex items-center justify-center gap-2 transition-colors font-medium"
      >
        <Play className="w-4 h-4" />
        {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
      </button>
    </div>
  );
}