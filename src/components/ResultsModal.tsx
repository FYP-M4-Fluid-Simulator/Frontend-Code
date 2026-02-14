"use client";

import { X } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "simulation" | "optimization";
  metrics: {
    cl: number;
    cd: number;
    cm: number;
    liftToDragRatio?: number;
    error?: number;
    loss?: number;
  };
  convergenceData?: Array<{
    iteration: number;
    cl: number;
    cd: number;
    cm: number;
    error?: number;
    loss?: number;
  }>;
}

export default function ResultsModal({
  isOpen,
  onClose,
  type,
  metrics,
  convergenceData = [],
}: ResultsModalProps) {
  if (!isOpen) return null;

  // Generate sample convergence data if not provided
  const chartData = convergenceData.length > 0 
    ? convergenceData 
    : Array.from({ length: 20 }, (_, i) => ({
        iteration: i + 1,
        cl: metrics.cl * (0.7 + Math.random() * 0.3),
        cd: metrics.cd * (0.8 + Math.random() * 0.4),
        cm: metrics.cm * (0.6 + Math.random() * 0.8),
        ...(type === "optimization" && {
          error: (metrics.error || 0.1) * Math.exp(-i / 10),
          loss: (metrics.loss || 0.5) * Math.exp(-i / 8),
        }),
      }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl border-2 border-blue-500/30">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-sm border-b border-blue-500/30 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                {type === "simulation" ? "Simulation" : "Optimization"} Results
              </h2>
              <p className="text-blue-300/60 text-sm mt-1">
                Aerodynamic coefficients and performance metrics
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-4">
              <div className="text-green-300 text-xs font-semibold mb-2">
                Lift Coefficient (C<sub>L</sub>)
              </div>
              <div className="text-green-100 text-2xl font-bold">
                {metrics.cl.toFixed(4)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-xl p-4">
              <div className="text-orange-300 text-xs font-semibold mb-2">
                Drag Coefficient (C<sub>D</sub>)
              </div>
              <div className="text-orange-100 text-2xl font-bold">
                {metrics.cd.toFixed(4)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-4">
              <div className="text-purple-300 text-xs font-semibold mb-2">
                Moment Coefficient (C<sub>M</sub>)
              </div>
              <div className="text-purple-100 text-2xl font-bold">
                {metrics.cm.toFixed(4)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl p-4">
              <div className="text-blue-300 text-xs font-semibold mb-2">
                {type === "optimization" ? "L/D Ratio" : "Lift-to-Drag"}
              </div>
              <div className="text-blue-100 text-2xl font-bold">
                {(metrics.liftToDragRatio || metrics.cl / metrics.cd).toFixed(2)}
              </div>
            </div>

            {type === "optimization" && (
              <>
                <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-400/30 rounded-xl p-4">
                  <div className="text-red-300 text-xs font-semibold mb-2">
                    Error
                  </div>
                  <div className="text-red-100 text-2xl font-bold">
                    {(metrics.error || 0).toFixed(6)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 rounded-xl p-4">
                  <div className="text-yellow-300 text-xs font-semibold mb-2">
                    Loss
                  </div>
                  <div className="text-yellow-100 text-2xl font-bold">
                    {(metrics.loss || 0).toFixed(6)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Aerodynamic Coefficients Chart */}
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-blue-200 mb-4">
              Aerodynamic Coefficients Convergence
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="iteration" 
                  stroke="#94a3b8"
                  label={{ value: 'Iteration', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  label={{ value: 'Coefficient Value', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #3b82f6",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#93c5fd" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cl"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="C_L"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cd"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="C_D"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cm"
                  stroke="#a855f7"
                  strokeWidth={2}
                  name="C_M"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Optimization-specific charts */}
          {type === "optimization" && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Error Convergence */}
              <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-blue-200 mb-4">
                  Error Convergence
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="iteration" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #3b82f6",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="error"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Error"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Loss Convergence */}
              <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-blue-200 mb-4">
                  Loss Convergence
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="iteration" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #3b82f6",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="loss"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Loss"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Coefficient Comparison Bar Chart */}
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-blue-200 mb-4">
              Final Coefficients Comparison
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { name: "C_L", value: metrics.cl, fill: "#10b981" },
                  { name: "C_D", value: metrics.cd, fill: "#f97316" },
                  { name: "C_M", value: Math.abs(metrics.cm), fill: "#a855f7" },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #3b82f6",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Close Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
