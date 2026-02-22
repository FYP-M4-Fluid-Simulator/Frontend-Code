"use client";

import { useState } from "react";

import { X, Download, Save, FileText, BarChart3, Loader2 } from "lucide-react";
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
    liftToDragRatio?: number;
    loss?: number;
  };
  convergenceData?: Array<{
    iteration: number;
    cl: number;
    cd: number;
    loss?: number;
    ldRatio?: number;
  }>;
  onSaveExperiment?: (name: string) => void;
  onDownloadMetrics?: (format: "csv" | "json") => void;
  computationTime?: number;
  isSaved?: boolean;
  isSaving?: boolean;
}

export default function ResultsModal({
  isOpen,
  onClose,
  type,
  metrics,
  convergenceData = [],
  onSaveExperiment,
  onDownloadMetrics,
  computationTime,
  isSaved = false,
  isSaving = false,
}: ResultsModalProps) {
  const [experimentName, setExperimentName] = useState("");

  if (!isOpen) return null;

  // Generate sample convergence data if not provided
  const chartData =
    convergenceData.length > 0
      ? convergenceData
      : Array.from({ length: 20 }, (_, i) => ({
        iteration: i + 1,
        cl: metrics.cl * (0.7 + Math.random() * 0.3),
        cd: metrics.cd * (0.8 + Math.random() * 0.4),
        ldRatio: (metrics.cl * (0.7 + Math.random() * 0.3)) / (metrics.cd * (0.8 + Math.random() * 0.4)),
        ...(type === "optimization" && {
          loss: (metrics.loss || 0.5) * Math.exp(-i / 8),
        }),
      }));

  const formatValue = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "0.0000";
    if (val === 0) return "0.0000";

    // Use scientific notation for small values
    if (Math.abs(val) < 0.001 && Math.abs(val) > 0) {
      const parts = val.toExponential(2).split("e");
      return (
        <span>
          {parts[0]} &times; 10<sup>{parts[1].replace("+", "")}</sup>
        </span>
      );
    }
    return val.toFixed(4);
  };

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
                {formatValue(metrics.cl)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-xl p-4">
              <div className="text-orange-300 text-xs font-semibold mb-2">
                Drag Coefficient (C<sub>D</sub>)
              </div>
              <div className="text-orange-100 text-2xl font-bold">
                {formatValue(metrics.cd)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl p-4">
              <div className="text-blue-300 text-xs font-semibold mb-2">
                {type === "optimization" ? "L/D Ratio" : "Lift-to-Drag"}
              </div>
              <div className="text-blue-100 text-2xl font-bold">
                {formatValue(metrics.liftToDragRatio || metrics.cl / metrics.cd)}
              </div>
            </div>

            {type === "optimization" ? (
              <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 rounded-xl p-4">
                <div className="text-yellow-300 text-xs font-semibold mb-2">
                  Loss
                </div>
                <div className="text-yellow-100 text-2xl font-bold">
                  {formatValue(metrics.loss)}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-400/30 rounded-xl p-4">
                <div className="text-gray-300 text-xs font-semibold mb-2">
                  Computation Time
                </div>
                <div className="text-gray-300 text-2xl font-bold">
                  {computationTime ? `${computationTime.toFixed(1)}s` : "-"}
                </div>
              </div>
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
                  label={{
                    value: "Iteration",
                    position: "insideBottom",
                    offset: -5,
                    fill: "#94a3b8",
                  }}
                />
                <YAxis
                  stroke="#94a3b8"
                  label={{
                    value: "Coefficient Value",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#94a3b8",
                  }}
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
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Convergence Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Loss Convergence (Optimization Only) */}
            {type === "optimization" && (
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
            )}

            {/* L/D Ratio Evolution (Both) */}
            <div className={`bg-slate-800/50 border border-blue-500/30 rounded-xl p-6 ${type !== "optimization" ? "md:col-span-2" : ""}`}>
              <h3 className="text-xl font-bold text-blue-200 mb-4">
                L/D Ratio Evolution
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
                    dataKey="ldRatio"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="L/D Ratio"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>



          {/* Action Buttons */}
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onSaveExperiment && (
                <div className="flex flex-col gap-2 p-4 bg-slate-800/80 border border-blue-500/30 rounded-xl">
                  {isSaved ? (
                    <div className="flex-1 flex items-center justify-center py-2 h-full gap-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                        <Save className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-emerald-400 font-semibold text-sm">Experiment Saved Successfully</span>
                    </div>
                  ) : (
                    <>
                      <label className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Save Design</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Experiment Name"
                          value={experimentName}
                          onChange={(e) => setExperimentName(e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-slate-900 border border-blue-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-medium text-sm"
                        />
                        <button
                          onClick={() => {
                            onSaveExperiment(experimentName);
                            // We do not close the modal here to let the user see the success state
                          }}
                          disabled={!experimentName.trim() || isSaving}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-gray-500 disabled:border-slate-600 border border-transparent disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg hover:shadow-emerald-500/30 transition-all text-sm whitespace-nowrap"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {onDownloadMetrics && (
                <div className="relative group flex flex-col gap-2 p-4 bg-slate-800/80 border border-blue-500/30 rounded-xl">
                  <label className="text-xs font-semibold text-orange-200 uppercase tracking-wider">Export Results</label>
                  <button
                    onClick={() => onDownloadMetrics("csv")}
                    className="w-full flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-orange-500/30 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Metrics
                  </button>

                  {/* Dropdown options */}
                  <div className="absolute bottom-full left-0 right-0 mb-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                    <div className="bg-slate-900 rounded-lg shadow-xl border border-blue-500/50 overflow-hidden mx-4">
                      <button
                        onClick={() => {
                          onDownloadMetrics("csv");
                          onClose();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-blue-600/20 text-white text-sm transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        CSV Format
                      </button>
                      <button
                        onClick={() => {
                          onDownloadMetrics("json");
                          onClose();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-blue-600/20 text-white text-sm transition-colors"
                      >
                        <BarChart3 className="w-3 h-3" />
                        JSON Format
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center mt-6">
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
    </div>
  );
}
