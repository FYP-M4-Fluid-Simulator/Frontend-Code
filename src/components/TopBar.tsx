'use client';

import { Play, Pause, RotateCcw, Download, Save, FileText } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface TopBarProps {
  selectedTab: 'design' | 'optimize' | 'turbine';
  onTabChange: (tab: 'design' | 'optimize' | 'turbine') => void;
  isSimulating: boolean;
  user: { email: string; name: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSavedDesigns: () => void;
  onOpenProfile: () => void;
}

export function TopBar({ selectedTab, onTabChange, isSimulating, user, onOpenAuth, onLogout, onOpenSavedDesigns, onOpenProfile }: TopBarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
      <div className="flex items-center gap-6">
        <h1 className="font-semibold text-gray-900">CFD Airfoil Optimizer</h1>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onTabChange('design')}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              selectedTab === 'design'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Design
          </button>
          <button
            onClick={() => onTabChange('optimize')}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              selectedTab === 'optimize'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Optimize
          </button>
          <button
            onClick={() => onTabChange('turbine')}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              selectedTab === 'turbine'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Turbine
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="New Project">
          <FileText className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Save">
          <Save className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Export">
          <Download className="w-4 h-4 text-gray-600" />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-2" />
        <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Reset">
          <RotateCcw className="w-4 h-4 text-gray-600" />
        </button>
        {isSimulating && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-blue-50 rounded">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-blue-700">Running...</span>
          </div>
        )}
        <div className="w-px h-6 bg-gray-200 mx-2" />
        
        {/* User Menu or Login Button */}
        {user ? (
          <UserMenu 
            user={user}
            onLogout={onLogout}
            onOpenSavedDesigns={onOpenSavedDesigns}
            onOpenProfile={onOpenProfile}
          />
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}