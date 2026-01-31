'use client';

import { useState } from 'react';
import { ProfessionalTurbine } from '../../components/ProfessionalTurbine';
import { useAppContext } from '../providers';

export default function TurbinePage() {
  const { liftToDragRatio, setLiftToDragRatio } = useAppContext();
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      <ProfessionalTurbine
        liftToDragRatio={liftToDragRatio}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
      {!isFullscreen && (
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 overflow-y-auto">
          <h2 className="font-semibold text-gray-900 mb-4">Turbine Performance</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 block mb-2">
                Lift-to-Drag Ratio: {liftToDragRatio.toFixed(1)}
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={0.1}
                value={liftToDragRatio}
                onChange={(e) => setLiftToDragRatio(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Rotation Speed</div>
                <div className="font-semibold text-lg text-blue-700">
                  {(liftToDragRatio * 0.12).toFixed(1)} RPM
                </div>
              </div>
              <div className="bg-green-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Power Output</div>
                <div className="font-semibold text-lg text-green-700">
                  {(liftToDragRatio * 2.5).toFixed(0)} kW
                </div>
              </div>
              <div className="bg-purple-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Efficiency</div>
                <div className="font-semibold text-lg text-purple-700">
                  {Math.min(95, (liftToDragRatio / 100) * 95).toFixed(1)}%
                </div>
              </div>
              <div className="bg-orange-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Tip Speed</div>
                <div className="font-semibold text-lg text-orange-700">
                  {(liftToDragRatio * 0.8).toFixed(1)} m/s
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Turbine Specs</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Rotor Diameter:</span>
                  <span className="font-medium text-gray-900">40 m</span>
                </div>
                <div className="flex justify-between">
                  <span>Blade Length:</span>
                  <span className="font-medium text-gray-900">19.5 m</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Blades:</span>
                  <span className="font-medium text-gray-900">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Wind Speed:</span>
                  <span className="font-medium text-gray-900">12 m/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}