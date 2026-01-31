'use client';

import { X, FileText, Trash2, Download, TrendingUp } from 'lucide-react';

interface SavedDesignsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedDesignsModal({ isOpen, onClose }: SavedDesignsModalProps) {
  if (!isOpen) return null;

  const savedDesigns = [
    {
      id: 1,
      name: 'NACA 4412 Optimized',
      date: '2024-01-15',
      ldRatio: 87.3,
      cl: 1.452,
      cd: 0.0166,
      type: 'Optimized'
    },
    {
      id: 2,
      name: 'S809 Wind Turbine',
      date: '2024-01-14',
      ldRatio: 65.2,
      cl: 1.305,
      cd: 0.0200,
      type: 'Standard'
    },
    {
      id: 3,
      name: 'Custom Airfoil v2',
      date: '2024-01-12',
      ldRatio: 72.8,
      cl: 1.383,
      cd: 0.0190,
      type: 'Custom'
    },
    {
      id: 4,
      name: 'NACA 0012 Baseline',
      date: '2024-01-10',
      ldRatio: 45.2,
      cl: 1.198,
      cd: 0.0265,
      type: 'Standard'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Saved Designs</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            {savedDesigns.map((design) => (
              <div
                key={design.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{design.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        design.type === 'Optimized' 
                          ? 'bg-green-100 text-green-700'
                          : design.type === 'Custom'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {design.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Saved on {design.date}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-green-50 rounded p-2">
                        <div className="text-xs text-gray-600">L/D Ratio</div>
                        <div className="text-sm font-bold text-green-700">{design.ldRatio}</div>
                      </div>
                      <div className="bg-blue-50 rounded p-2">
                        <div className="text-xs text-gray-600">C<sub>L</sub></div>
                        <div className="text-sm font-bold text-blue-700">{design.cl}</div>
                      </div>
                      <div className="bg-red-50 rounded p-2">
                        <div className="text-xs text-gray-600">C<sub>D</sub></div>
                        <div className="text-sm font-bold text-red-700">{design.cd}</div>
                      </div>
                      <div className="bg-purple-50 rounded p-2">
                        <div className="text-xs text-gray-600">Efficiency</div>
                        <div className="text-sm font-bold text-purple-700">
                          {((design.ldRatio / 100) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600" title="Load Design">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>


     {/* this code block is for  */}
          {savedDesigns.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No saved designs yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start by running simulations and saving your results
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {savedDesigns.length} design{savedDesigns.length !== 1 ? 's' : ''} saved
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}