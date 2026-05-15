"use client";

import { useState, useEffect } from "react";
import {
  Wind,
  ArrowLeft,
  Download,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ProfessionalTurbine } from "../../components/ProfessionalTurbine";
import { useRouter } from "next/navigation";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

// ─── Turbine scale definitions ───────────────────────────────────────────────
type TurbineScale = "small" | "medium" | "large";

const TURBINE_SCALES: Record<
  TurbineScale,
  { label: string; radius: number; windSpeed: number; tsr: number; color: string; bgColor: string; borderColor: string; icon: string }
> = {
  small: {
    label: "Small",
    radius: 3,
    windSpeed: 10,
    tsr: 6,
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-300",
    icon: "◎",
  },
  medium: {
    label: "Medium",
    radius: 20,
    windSpeed: 11,
    tsr: 7,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    icon: "◈",
  },
  large: {
    label: "Large (Utility)",
    radius: 80,
    windSpeed: 12,
    tsr: 8,
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-300",
    icon: "◉",
  },
};

const AIR_DENSITY = 1.225; // kg/m³

// ─── Power calculation (pure frontend) ───────────────────────────────────────
function calculatePower(
  cl: number,
  cd: number,
  scale: TurbineScale,
): { watts: number; kilowatts: number; rpm: number; cp: number } | null {
  if (cl <= 0 || cd <= 0) return null;
  const { radius, windSpeed, tsr } = TURBINE_SCALES[scale];

  // Step 1: Power Coefficient
  // Cp = 0.593 * (1 - (Cd/Cl) * λ)
  const cp = 0.593 * (1 - (cd / cl) * tsr);

  // Step 2: Total Power
  // P = 0.5 * ρ * π * R² * V³ * Cp
  const watts = 0.5 * AIR_DENSITY * Math.PI * radius ** 2 * windSpeed ** 3 * cp;

  // RPM = (λ * V * 30) / (π * R)
  const rpm = (tsr * windSpeed * 30) / (Math.PI * radius);

  return { watts, kilowatts: watts / 1000, rpm, cp };
}

type PowerOutputResult = {
  total_power_watts: number;
  total_power_kilowatts: number;
  operating_rpm: number;
  cp: number;
  scale: TurbineScale;
};

type CFDInputState = {
  chordLength: number;
  angleOfAttack: number;
  velocity: number;
  hasSource: boolean;
};

type StoredAeroResults = {
  /** XFoil-only payload (simulation + optimization) */
  xfoilCl?: number | null;
  xfoilCd?: number | null;
  xfoilLd?: number | null;
  xfoilStatus?: string | null;
  timestamp?: string;
  computationTime?: number;
};

const DEFAULT_CFD_INPUTS: CFDInputState = {
  chordLength: 1,
  angleOfAttack: 5,
  velocity: 30,
  hasSource: false,
};

export default function TurbinePage() {
  const router = useRouter();

  // Turbine state
  const [liftToDragRatio, setLiftToDragRatio] = useState(45.0);
  const [liftCoefficient, setLiftCoefficient] = useState(0);
  const [dragCoefficient, setDragCoefficient] = useState(0);
  const [dataSource, setDataSource] = useState<"simulation" | "optimization" | "none">("none");
  const [powerError, setPowerError] = useState<string | null>(null);
  const [powerResults, setPowerResults] = useState<Record<TurbineScale, PowerOutputResult | null>>({
    small: null,
    medium: null,
    large: null,
  });
  const [cfdInputs, setCfdInputs] = useState<CFDInputState>(DEFAULT_CFD_INPUTS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load latest CFD metrics from sessionStorage if available.
  useEffect(() => {
    const savedResults = sessionStorage.getItem("simulationResults");
    const savedOptResults = sessionStorage.getItem("optimizationResults");
    const savedCfdState = sessionStorage.getItem("cfdState");

    const parseNumericValue = (value: unknown): number => {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : NaN;
      }
      if (typeof value !== "string") return NaN;

      const normalized = value
        .trim()
        .replace(/\s+/g, "")
        .replace("×", "x")
        .replace("−", "-");

      // Supports forms like "1.38x10-7", "1.38x10^-7", "1.38e-7"
      const sciMatch = normalized.match(
        /^([+-]?\d*\.?\d+)[x*]10(?:\^)?([+-]?\d+)$/i,
      );
      if (sciMatch) {
        const base = Number(sciMatch[1]);
        const exp = Number(sciMatch[2]);
        if (Number.isFinite(base) && Number.isFinite(exp)) {
          return base * Math.pow(10, exp);
        }
      }

      const numeric = Number(normalized);
      return Number.isFinite(numeric) ? numeric : NaN;
    };

    const toNumberOrDefault = (value: unknown, fallback: number) => {
      const parsed = parseNumericValue(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    /** Reject sentinel (0,0) blobs — often written when optimizing resets or cache is missing. */
    const hasUsableCoeffs = (cl: number, cd: number) =>
      Number.isFinite(cl) &&
      Number.isFinite(cd) &&
      !(cl === 0 && cd === 0);

    const parseResults = (raw: string | null): StoredAeroResults | null => {
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StoredAeroResults;
      } catch {
        return null;
      }
    };

    const getPayloadTimeMs = (payload: StoredAeroResults): number => {
      if (!payload.timestamp) return NaN;
      const t = new Date(payload.timestamp).getTime();
      return Number.isFinite(t) ? t : NaN;
    };

    const extractXFoilFromPayload = (
      payload: StoredAeroResults,
    ): { cl: number; cd: number; ld: number } | null => {
      const cl = parseNumericValue(payload.xfoilCl);
      const cd = parseNumericValue(payload.xfoilCd);
      if (!Number.isFinite(cl) || !Number.isFinite(cd)) return null;

      let ld = parseNumericValue(payload.xfoilLd);
      if (!Number.isFinite(ld) || ld === 0) {
        ld = cd !== 0 ? cl / cd : NaN;
      }
      if (!Number.isFinite(ld)) ld = 0;

      if (!hasUsableCoeffs(cl, cd)) return null;
      return { cl, cd, ld };
    };

    const simulationResults = parseResults(savedResults);
    const optimizationResults = parseResults(savedOptResults);

    const simExtracted = simulationResults
      ? extractXFoilFromPayload(simulationResults)
      : null;
    const optExtracted = optimizationResults
      ? extractXFoilFromPayload(optimizationResults)
      : null;
    const simTs = simulationResults ? getPayloadTimeMs(simulationResults) : NaN;
    const optTs = optimizationResults ? getPayloadTimeMs(optimizationResults) : NaN;

    let cl = 0;
    let cd = 0;
    let ld = 0;
    let source: "simulation" | "optimization" | "none" = "none";

    if (simExtracted && optExtracted) {
      const simTimeOk = Number.isFinite(simTs);
      const optTimeOk = Number.isFinite(optTs);
      let pickOptimization = false;

      if (simTimeOk && optTimeOk) {
        pickOptimization = optTs > simTs;
      } else if (optTimeOk && !simTimeOk) {
        pickOptimization = true;
      } else if (!optTimeOk && simTimeOk) {
        pickOptimization = false;
      } else {
        /** No reliable timestamps → prefer freshest-looking non-sentinel data */
        pickOptimization = false;
      }

      const chosen = pickOptimization ? optExtracted : simExtracted;
      ({ cl, cd, ld } = chosen);
      source = pickOptimization ? "optimization" : "simulation";
    } else if (simExtracted) {
      ({ cl, cd, ld } = simExtracted);
      source = "simulation";
    } else if (optExtracted) {
      ({ cl, cd, ld } = optExtracted);
      source = "optimization";
    }

    if (hasUsableCoeffs(cl, cd)) {
      setLiftCoefficient(cl);
      setDragCoefficient(cd);
      const ldShown =
        Number.isFinite(ld) && ld !== 0 ? ld : cd !== 0 ? cl / cd : 0;
      setLiftToDragRatio(ldShown);
      setDataSource(source);
    } else {
      setDataSource("none");
    }

    if (savedCfdState) {
      try {
        const parsedCfdState = JSON.parse(savedCfdState);
        setCfdInputs({
          chordLength: toNumberOrDefault(
            parsedCfdState.chordLength,
            DEFAULT_CFD_INPUTS.chordLength,
          ),
          angleOfAttack: toNumberOrDefault(
            parsedCfdState.angleOfAttack,
            DEFAULT_CFD_INPUTS.angleOfAttack,
          ),
          velocity: toNumberOrDefault(
            parsedCfdState.velocity,
            DEFAULT_CFD_INPUTS.velocity,
          ),
          hasSource: true,
        });
      } catch {
        setCfdInputs(DEFAULT_CFD_INPUTS);
      }
    }
  }, []);

  const formatCoefficient = (value: number) => {
    if (!Number.isFinite(value)) return "—";
    if (value === 0) return "0.0000";
    if (Math.abs(value) < 0.001) {
      return value.toExponential(2);
    }
    return value.toFixed(4);
  };

  // Auto-calculate power whenever Cl/Cd changes
  useEffect(() => {
    if (liftCoefficient > 0 && dragCoefficient > 0) {
      handleCalculatePower();
    }
  }, [liftCoefficient, dragCoefficient]);

  const handleCalculatePower = () => {
    setPowerError(null);
    setPowerResults({ small: null, medium: null, large: null });

    if (liftCoefficient <= 0 || dragCoefficient <= 0) {
      setPowerError(
        "Valid Cl and Cd are required. Please run a CFD simulation first.",
      );
      return;
    }

    // Calculate power for all three scales
    const scales: TurbineScale[] = ["small", "medium", "large"];
    const results: Record<TurbineScale, PowerOutputResult | null> = {
      small: null,
      medium: null,
      large: null,
    };

    scales.forEach((scale) => {
      const result = calculatePower(liftCoefficient, dragCoefficient, scale);
      if (result) {
        results[scale] = {
          total_power_watts: result.watts,
          total_power_kilowatts: result.kilowatts,
          operating_rpm: result.rpm,
          cp: result.cp,
          scale: scale,
        };
      }
    });

    setPowerResults(results);
  };

  const handleExportResults = () => {
    const results = {
      liftToDragRatio,
      xfoilCl: liftCoefficient,
      xfoilCd: dragCoefficient,
      turbines: {
        small: powerResults.small ? {
          rotorRadius: TURBINE_SCALES.small.radius,
          designWindSpeed: TURBINE_SCALES.small.windSpeed,
          tipSpeedRatio: TURBINE_SCALES.small.tsr,
          powerCoefficientCp: powerResults.small.cp,
          operatingRpm: powerResults.small.operating_rpm,
          powerW: powerResults.small.total_power_watts,
          powerKw: powerResults.small.total_power_kilowatts,
        } : null,
        medium: powerResults.medium ? {
          rotorRadius: TURBINE_SCALES.medium.radius,
          designWindSpeed: TURBINE_SCALES.medium.windSpeed,
          tipSpeedRatio: TURBINE_SCALES.medium.tsr,
          powerCoefficientCp: powerResults.medium.cp,
          operatingRpm: powerResults.medium.operating_rpm,
          powerW: powerResults.medium.total_power_watts,
          powerKw: powerResults.medium.total_power_kilowatts,
        } : null,
        large: powerResults.large ? {
          rotorRadius: TURBINE_SCALES.large.radius,
          designWindSpeed: TURBINE_SCALES.large.windSpeed,
          tipSpeedRatio: TURBINE_SCALES.large.tsr,
          powerCoefficientCp: powerResults.large.cp,
          operatingRpm: powerResults.large.operating_rpm,
          powerW: powerResults.large.total_power_watts,
          powerKw: powerResults.large.total_power_kilowatts,
        } : null,
      },
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turbine-performance-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-300 flex items-center justify-between px-4 py-2 shadow-sm z-40">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/design")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-all text-xs font-semibold text-gray-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Design
          </button>

          <button
            onClick={handleExportResults}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-green-600"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>

          <button
            onClick={() => router.push("/simulate")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-cyan-50 border border-gray-300 hover:border-cyan-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-cyan-600"
          >
            <Settings className="w-3.5 h-3.5" />
            Run Simulation
          </button>

          <button
            onClick={() => router.push("/optimize")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 border border-gray-300 hover:border-orange-400 rounded-lg transition-all text-xs font-semibold text-gray-700 hover:text-orange-600"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Optimize Design
          </button>
        </div>

        {/* Center: Branding */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg">
            <Wind className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white tracking-wide">
              CFD AIRFOIL PLATFORM
            </span>
          </div>
          <div className="px-3 py-1 bg-green-100 rounded-lg border border-green-300">
            <span className="text-xs font-bold text-green-800">
              Turbine Visualization
            </span>
          </div>
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2">
          <UserProfileDropdown />
        </div>
      </div>

      {/* Main Content - Turbine Visualization */}
      <div className="flex-1 flex overflow-hidden relative bg-gradient-to-br from-gray-50 via-white to-green-50">
        {/* Performance Summary Sidebar with Hide/Show */}
        <div
          className={`absolute top-4 right-4 z-30 transition-all duration-300 ${
            sidebarCollapsed ? "translate-x-[calc(100%-2.5rem)]" : "translate-x-0"
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-green-300 overflow-hidden relative">
            {/* Hide/Show Button - Always Visible */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute left-3 top-3 bg-green-100 hover:bg-green-200 border border-green-400 rounded-lg p-1.5 transition-colors z-50"
              title={sidebarCollapsed ? "Show Performance Summary" : "Hide Performance Summary"}
            >
              {sidebarCollapsed ? (
                <ChevronLeft className="w-4 h-4 text-green-700" />
              ) : (
                <ChevronRight className="w-4 h-4 text-green-700" />
              )}
            </button>

            {!sidebarCollapsed && (
              <div className="p-5 min-w-[280px] pt-12">
                <h3 className="text-sm font-black text-green-900 mb-3 flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  Performance Summary
                </h3>

                <div className="space-y-2 text-sm font-medium">
                  {dataSource === "none" && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-[11px] font-bold text-amber-800 uppercase mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Warning
                      </div>
                      <div className="text-[11px] text-amber-700 leading-tight">
                        No XFoil data found. Run a{" "}
                        <span
                          className="font-bold cursor-pointer underline text-amber-900"
                          onClick={() => router.push("/simulate")}
                        >
                          simulation
                        </span>{" "}
                        or{" "}
                        <span
                          className="font-bold cursor-pointer underline text-amber-900"
                          onClick={() => router.push("/optimize")}
                        >
                          optimization
                        </span>{" "}
                        until XFoil results are produced, then open this page again.
                      </div>
                    </div>
                  )}

                  {dataSource !== "none" && (
                    <div className="mb-3 px-2 py-1 bg-green-50 border border-green-200 rounded text-[10px] font-bold text-green-700 uppercase flex items-center gap-1.5 shadow-sm">
                      XFoil coefficients ({dataSource}) active
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      Lift Coefficient (C<sub>L</sub>):
                    </span>
                    <span className="text-base font-black text-cyan-700">
                      {dataSource !== "none"
                        ? formatCoefficient(liftCoefficient)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      Drag Coefficient (C<sub>D</sub>):
                    </span>
                    <span className="text-base font-black text-rose-700">
                      {dataSource !== "none"
                        ? formatCoefficient(dragCoefficient)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Lift-to-Drag Ratio (L/D):</span>
                    <span className="text-base font-black text-green-700">
                      {dataSource !== "none" ? liftToDragRatio.toFixed(1) : "—"}
                    </span>
                  </div>
                </div>

                {powerError && (
                  <div className="mt-4 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md p-2 leading-relaxed">
                    {powerError}
                  </div>
                )}
              </div>
            )}

            {/* Collapsed state - just show the button */}
            {sidebarCollapsed && (
              <div className="w-10 h-10"></div>
            )}
          </div>
        </div>

        {/* Three Turbines Display */}
        <div className="flex-1 relative">
          <div className="absolute inset-4 rounded-xl shadow-2xl overflow-hidden border-2 border-gray-300 bg-[#0a0e1a]">
            <div className="h-full w-full grid grid-cols-3 gap-0">
              {/* Small Turbine */}
              <div className="relative flex flex-col items-center justify-center border-r border-gray-700">
                {/* Label */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-cyan-900/80 backdrop-blur-sm px-4 py-1 rounded-lg border border-cyan-600">
                    <span className="text-xs font-bold text-cyan-200 uppercase tracking-wide">
                      SMALL
                    </span>
                  </div>
                </div>

                {/* Power Output - Above Turbine */}
                {powerResults.small && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-cyan-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-cyan-500 text-center">
                      <div className="text-lg font-black text-cyan-100">
                        {(() => {
                          const absKw = Math.abs(powerResults.small.total_power_kilowatts);
                          return absKw >= 1
                            ? `${absKw.toFixed(1)} kW`
                            : `${(absKw * 1000).toFixed(0)} W`;
                        })()}
                      </div>
                      <div className="text-[9px] font-semibold text-cyan-300">
                        Cp: {(powerResults.small.cp * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Turbine Canvas */}
                <div className="flex-1 w-full">
                  <ProfessionalTurbine
                    liftToDragRatio={liftToDragRatio}
                    powerKilowatts={powerResults.small?.total_power_kilowatts ?? null}
                    rpm={powerResults.small?.operating_rpm ?? null}
                    scaleFactor={0.55}
                    showAnnotations={false}
                  />
                </div>

                {/* Constants - Below Turbine */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-cyan-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-600">
                    <div className="flex gap-3 text-[10px] font-semibold text-cyan-200">
                      <span>R: {TURBINE_SCALES.small.radius}m</span>
                      <span>TSR: {TURBINE_SCALES.small.tsr}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medium Turbine */}
              <div className="relative flex flex-col items-center justify-center border-r border-gray-700">
                {/* Label */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-green-900/80 backdrop-blur-sm px-4 py-1 rounded-lg border border-green-600">
                    <span className="text-xs font-bold text-green-200 uppercase tracking-wide">
                      MEDIUM
                    </span>
                  </div>
                </div>

                {/* Power Output - Above Turbine */}
                {powerResults.medium && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-green-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-500 text-center">
                      <div className="text-lg font-black text-green-100">
                        {(() => {
                          const absKw = Math.abs(powerResults.medium.total_power_kilowatts);
                          return absKw >= 1
                            ? `${absKw.toFixed(1)} kW`
                            : `${(absKw * 1000).toFixed(0)} W`;
                        })()}
                      </div>
                      <div className="text-[9px] font-semibold text-green-300">
                        Cp: {(powerResults.medium.cp * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Turbine Canvas */}
                <div className="flex-1 w-full">
                  <ProfessionalTurbine
                    liftToDragRatio={liftToDragRatio}
                    powerKilowatts={powerResults.medium?.total_power_kilowatts ?? null}
                    rpm={powerResults.medium?.operating_rpm ?? null}
                    scaleFactor={1.0}
                    showAnnotations={false}
                  />
                </div>

                {/* Constants - Below Turbine */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-green-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-green-600">
                    <div className="flex gap-3 text-[10px] font-semibold text-green-200">
                      <span>R: {TURBINE_SCALES.medium.radius}m</span>
                      <span>TSR: {TURBINE_SCALES.medium.tsr}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Large Turbine */}
              <div className="relative flex flex-col items-center justify-center">
                {/* Label */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-teal-900/80 backdrop-blur-sm px-4 py-1 rounded-lg border border-teal-600">
                    <span className="text-xs font-bold text-teal-200 uppercase tracking-wide">
                      LARGE
                    </span>
                  </div>
                </div>

                {/* Power Output - Above Turbine */}
                {powerResults.large && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-teal-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-teal-500 text-center">
                      <div className="text-lg font-black text-teal-100">
                        {(() => {
                          const absKw = Math.abs(powerResults.large.total_power_kilowatts);
                          return absKw >= 1000
                            ? `${(absKw / 1000).toFixed(2)} MW`
                            : `${absKw.toFixed(1)} kW`;
                        })()}
                      </div>
                      <div className="text-[9px] font-semibold text-teal-300">
                        Cp: {(powerResults.large.cp * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Turbine Canvas */}
                <div className="flex-1 w-full">
                  <ProfessionalTurbine
                    liftToDragRatio={liftToDragRatio}
                    powerKilowatts={powerResults.large?.total_power_kilowatts ?? null}
                    rpm={powerResults.large?.operating_rpm ?? null}
                    scaleFactor={1.65}
                    showAnnotations={false}
                  />
                </div>

                {/* Constants - Below Turbine */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-teal-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-teal-600">
                    <div className="flex gap-3 text-[10px] font-semibold text-teal-200">
                      <span>R: {TURBINE_SCALES.large.radius}m</span>
                      <span>TSR: {TURBINE_SCALES.large.tsr}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
