"use client";

import { useState, useEffect } from "react";
import {
  Wind,
  ArrowLeft,
  Download,
  Settings,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { ProfessionalTurbine } from "../../components/ProfessionalTurbine";
import { useRouter } from "next/navigation";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { auth } from "@/lib/firebase/config";
import { PYTHON_BACKEND_URL } from "@/config";

type PowerOutputResult = {
  total_power_watts: number;
  total_power_kilowatts: number;
  operating_rpm: number;
};

type CFDInputState = {
  chordLength: number;
  angleOfAttack: number;
  velocity: number;
  hasSource: boolean;
};

const DEFAULT_CFD_INPUTS: CFDInputState = {
  chordLength: 1,
  angleOfAttack: 5,
  velocity: 30,
  hasSource: false,
};

const TURBINE_CONSTANTS = {
  rotor_radius: 35,
  hub_radius: 1.0,
  num_blades: 3,
  num_elements: 20,
};

const TSR_LIMITS = {
  min: 1,
  max: 15,
  step: 0.1,
};

export default function TurbinePage() {
  const router = useRouter();

  // Turbine state
  const [liftToDragRatio, setLiftToDragRatio] = useState(45.0);
  const [liftCoefficient, setLiftCoefficient] = useState(0);
  const [dragCoefficient, setDragCoefficient] = useState(0);
  const [showPowerPanel, setShowPowerPanel] = useState(false);
  const [isCalculatingPower, setIsCalculatingPower] = useState(false);
  const [powerError, setPowerError] = useState<string | null>(null);
  const [tsr, setTsr] = useState(7);
  const [powerResult, setPowerResult] = useState<PowerOutputResult | null>(
    null,
  );
  const [cfdInputs, setCfdInputs] = useState<CFDInputState>(DEFAULT_CFD_INPUTS);

  const currentPowerKilowatts = powerResult?.total_power_kilowatts ?? null;

  // Load latest CFD metrics from sessionStorage if available.
  useEffect(() => {
    const savedResults = sessionStorage.getItem("simulationResults");
    const savedOptResults = sessionStorage.getItem("optimizationResults");
    const savedCfdState = sessionStorage.getItem("cfdState");

    const toNumberOrDefault = (value: unknown, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    if (savedOptResults) {
      const results = JSON.parse(savedOptResults);
      setLiftToDragRatio(
        results.bestLiftToDragRatio || results.liftToDragRatio || 66.6,
      );
      setLiftCoefficient(
        results.bestLiftCoefficient ||
          results.liftCoefficient ||
          results.cl ||
          0,
      );
      setDragCoefficient(
        results.bestDragCoefficient ||
          results.dragCoefficient ||
          results.cd ||
          0,
      );
    } else if (savedResults) {
      const results = JSON.parse(savedResults);
      setLiftToDragRatio(results.liftToDragRatio || 36.5);
      setLiftCoefficient(results.liftCoefficient || results.cl || 0);
      setDragCoefficient(results.dragCoefficient || results.cd || 0);
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

  const handleCalculatePower = async () => {
    setShowPowerPanel(true);
    setPowerError(null);
    setPowerResult(null);
    setIsCalculatingPower(true);

    try {
      const token = auth?.currentUser
        ? await auth.currentUser.getIdToken()
        : "";
      if (!token) {
        throw new Error("You must be logged in to calculate power output.");
      }

      const apiUrl = `${PYTHON_BACKEND_URL}${PYTHON_BACKEND_URL?.endsWith("/") ? "" : "/"}power-output`;
      const payload = {
        v_wind: cfdInputs.velocity,
        alpha_deg: cfdInputs.angleOfAttack,
        cl: liftCoefficient,
        cd: dragCoefficient,
        chord: cfdInputs.chordLength,
        tsr, // Note: tsr - tip speed ratio
        ...TURBINE_CONSTANTS,
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = `Power calculation failed (${response.status}).`;
        try {
          const errorData = await response.json();
          const backendMessage =
            errorData?.detail || errorData?.message || errorData?.error;
          if (backendMessage) {
            message = String(backendMessage);
          }
        } catch {
          // Keep fallback error message if response body is not JSON.
        }
        throw new Error(message);
      }

      const data = await response.json();
      const totalPowerWatts = Number(data?.total_power_watts);
      const totalPowerKilowatts = Number(data?.total_power_kilowatts);
      const operatingRpm = Number(data?.operating_rpm);

      if (
        !Number.isFinite(totalPowerWatts) ||
        !Number.isFinite(totalPowerKilowatts) ||
        !Number.isFinite(operatingRpm)
      ) {
        throw new Error("Backend returned an invalid power output response.");
      }

      setPowerResult({
        total_power_watts: totalPowerWatts,
        total_power_kilowatts: totalPowerKilowatts,
        operating_rpm: operatingRpm,
      });
    } catch (error) {
      setPowerError(
        error instanceof Error
          ? error.message
          : "Unable to calculate power output right now.",
      );
    } finally {
      setIsCalculatingPower(false);
    }
  };

  const handleExportResults = () => {
    const results = {
      liftToDragRatio,
      liftCoefficient,
      dragCoefficient,
      tsr,
      operatingRpm: powerResult?.operating_rpm ?? null,
      powerW: powerResult?.total_power_watts ?? null,
      powerKw: powerResult?.total_power_kilowatts ?? null,
      efficiency: Math.min(98.5, (liftToDragRatio / 80) * 95),
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
        {/* Performance Stats Overlay */}
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-green-300 p-5 min-w-[280px]">
            <h3 className="text-sm font-black text-green-900 mb-3 flex items-center gap-2">
              <Wind className="w-4 h-4" />
              Performance Summary
            </h3>

            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between">
                <span className="text-gray-700">Lift Coeff (Cl):</span>
                <span className="text-base font-black text-cyan-700">
                  {liftCoefficient.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Drag Coeff (Cd):</span>
                <span className="text-base font-black text-rose-700">
                  {dragCoefficient.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">L/D Ratio:</span>
                <span className="text-base font-black text-green-700">
                  {liftToDragRatio.toFixed(1)}
                </span>
              </div>
              {/* <div className="flex justify-between">
                <span className="text-gray-700">RPM:</span>
                <span className="text-base font-black text-blue-700">
                  {(liftToDragRatio * 0.25).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Power:</span>
                <span className="text-base font-black text-orange-700">
                  {(liftToDragRatio * 3.2).toFixed(0)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Efficiency:</span>
                <span className="text-base font-black text-purple-700">
                  {Math.min(98.5, (liftToDragRatio / 80) * 95).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Status:</span>
                <span className="text-base font-black text-green-600">
                  OPTIMAL
                </span>
              </div> */}
            </div>

            {/* Power Panel */}
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-3 text-xs">
              <div>
                <div className="text-xs font-bold text-gray-700 mb-2">
                  Input Metrics
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chord Length</span>
                    <span className="font-semibold text-gray-900">
                      {cfdInputs.chordLength.toFixed(2)} m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Angle of Attack</span>
                    <span className="font-semibold text-gray-900">
                      {cfdInputs.angleOfAttack.toFixed(2)} °
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inflow Velocity</span>
                    <span className="font-semibold text-gray-900">
                      {cfdInputs.velocity.toFixed(2)} m/s
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-700 mb-2">
                  Turbine Constants
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rotor Radius</span>
                    <span className="font-semibold text-gray-900">
                      {TURBINE_CONSTANTS.rotor_radius.toFixed(1)} m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hub Radius</span>
                    <span className="font-semibold text-gray-900">
                      {TURBINE_CONSTANTS.hub_radius.toFixed(1)} m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Blades</span>
                    <span className="font-semibold text-gray-900">
                      {TURBINE_CONSTANTS.num_blades}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Elements</span>
                    <span className="font-semibold text-gray-900">
                      {TURBINE_CONSTANTS.num_elements}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700">TSR</span>
                  <span className="text-xs font-black text-green-700">
                    {tsr.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={TSR_LIMITS.min}
                  max={TSR_LIMITS.max}
                  step={TSR_LIMITS.step}
                  value={tsr}
                  onChange={(event) => setTsr(Number(event.target.value))}
                  className="w-full h-2 accent-green-600"
                  disabled={isCalculatingPower}
                />
              </div>

              <button
                onClick={handleCalculatePower}
                disabled={isCalculatingPower}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {isCalculatingPower ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Calculate"
                )}
              </button>

              {isCalculatingPower && (
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-600">
                    Calculating power output...
                  </div>
                  <div className="w-full h-1.5 bg-green-100 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}

              {powerError && (
                <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
                  {powerError}
                </div>
              )}

              {powerResult && !isCalculatingPower && (
                <div className="bg-green-50 border border-green-200 rounded-md p-2 space-y-1.5">
                  <div className="text-xs font-bold text-green-800 mb-1">
                    Power Output
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-700 text-xs">kW</span>
                    <span className="font-black text-green-800 text-lg">
                      {powerResult.total_power_kilowatts.toExponential(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-700 text-xs">W</span>
                    <span className="font-bold text-green-900 text-sm">
                      {powerResult.total_power_watts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-700 text-xs">Operating RPM</span>
                    <span className="font-bold text-green-900 text-sm">
                      {powerResult.operating_rpm.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Turbine Component */}
        <div className="flex-1 relative">
          <div className="absolute inset-4 rounded-xl shadow-2xl overflow-hidden border-2 border-gray-300">
            <ProfessionalTurbine
              liftToDragRatio={liftToDragRatio}
              powerKilowatts={currentPowerKilowatts}
            />
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-300 px-6 py-2">
            <div className="text-xs font-medium text-gray-700 text-center">
              Wind Turbine Performance Visualization • Real-time CFD Analysis
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
