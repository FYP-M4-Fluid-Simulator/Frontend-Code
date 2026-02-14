"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface Airfoil {
  id: string;
  name: string;
  imageUrl: string;
  cl: number;
  cd: number;
  dateModified: string;
}

export default function AirfoilDeck() {
  const router = useRouter();
  const [airfoils, setAirfoils] = useState<Airfoil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAirfoils();
  }, []);

  const fetchAirfoils = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch from the correct API endpoint
      const response = await fetch("/api/airfoil_deck");

      if (!response.ok) {
        throw new Error("Failed to fetch airfoils");
      }

      const data = await response.json();
      setAirfoils(data);
    } catch (err) {
      console.error("Error fetching airfoils:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAirfoilClick = (airfoil: Airfoil) => {
    // Store selected airfoil in sessionStorage and navigate to design page
    sessionStorage.setItem("selectedAirfoil", JSON.stringify(airfoil));
    router.push("/design");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">
            Loading airfoils...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl font-semibold mb-2">
            ⚠️ Error
          </div>
          <div className="text-red-300">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => router.push("/design")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl transition-all shadow-lg hover:shadow-blue-500/50 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Design
          </button>
          <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 text-5xl font-bold">
            My Airfoil Deck
          </h1>
          <div className="w-40"></div> {/* Spacer for centering */}
        </div>

        <div className="space-y-5">
          {airfoils.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/30 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="text-gray-300 text-xl font-semibold mb-2">
                No airfoils found
              </div>
              <div className="text-gray-500 text-sm mb-6">
                Create your first airfoil design to get started!
              </div>
              <button
                onClick={() => router.push("/design")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Start Designing
              </button>
            </div>
          ) : (
            airfoils.map((airfoil) => (
              <div
                key={airfoil.id}
                onClick={() => handleAirfoilClick(airfoil)}
                className="group relative bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-2 border-blue-500/30 hover:border-cyan-400/60 rounded-2xl p-6 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>

                <div className="relative flex items-center gap-6">
                  {/* Airfoil Image */}
                  <div className="flex-shrink-0">
                    <div className="w-40 h-28 border-2 border-blue-400/40 group-hover:border-cyan-400/60 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center transition-all duration-300 shadow-lg">
                      {airfoil.imageUrl ? (
                        <Image
                          src={airfoil.imageUrl}
                          alt={airfoil.name}
                          width={160}
                          height={112}
                          className="object-contain"
                        />
                      ) : (
                        <div className="text-center px-2">
                          <svg
                            className="w-14 h-14 mx-auto mb-2 text-blue-400/50 group-hover:text-cyan-400/60 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-blue-300/60 text-xs font-medium">
                            Airfoil Profile
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Airfoil Details */}
                  <div className="flex-grow flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 mb-1">
                        {airfoil.name || "Name of Airfoil"}
                      </h3>
                      <div className="text-blue-300/60 text-sm">
                        Click to load design
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center px-4 py-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg">
                        <div className="text-green-300 text-xs font-semibold mb-1">
                          Lift Coefficient
                        </div>
                        <div className="text-green-100 text-xl font-bold">
                          {airfoil.cl.toFixed(3)}
                        </div>
                      </div>
                      <div className="text-center px-4 py-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-lg">
                        <div className="text-orange-300 text-xs font-semibold mb-1">
                          Drag Coefficient
                        </div>
                        <div className="text-orange-100 text-xl font-bold">
                          {airfoil.cd.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date Modified */}
                  <div className="flex-shrink-0">
                    <div className="text-right px-4 py-2 bg-slate-800/50 border border-slate-600/30 rounded-lg">
                      <div className="text-slate-400 text-xs font-semibold mb-1">
                        Modified
                      </div>
                      <div className="text-slate-200 text-sm font-medium">
                        {formatDate(airfoil.dateModified)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
