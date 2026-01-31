'use client';

import { X, User, Mail, Calendar, Award } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { email: string; name: string } | null;
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-3xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-blue-100">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Account Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-900 focus:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Email Address</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-900 focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">42</div>
                <div className="text-xs text-gray-600 mt-1">Simulations Run</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">8</div>
                <div className="text-xs text-gray-600 mt-1">Optimizations</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">4</div>
                <div className="text-xs text-gray-600 mt-1">Saved Designs</div>
              </div>
            </div>
          </div>

          {/* Membership */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership</h3>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Pro Plan</p>
                    <p className="text-xs text-gray-600">Unlimited simulations & optimizations</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                  Manage Plan
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-amber-200 flex items-center gap-2 text-xs text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Member since January 2024</span>
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
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}