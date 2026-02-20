"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Wind,
  FolderOpen,
  Database,
  Settings,
  ArrowLeft,
  Plus,
  Upload,
  ArrowRight,
} from "lucide-react";
import { PYTHON_BACKEND_URL } from "@/config";

interface Airfoil {
  id: string;
  name: string;
  imageUrl: string;
  cl: number;
  cd: number;
  dateModified: string;
}

type ViewMode = "home" | "saved";

export default function AirfoilDeck() {
  const router = useRouter();
  const [airfoils, setAirfoils] = useState<Airfoil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const itemsPerPage = 10;

  // File import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLeadingEdgeModal, setShowLeadingEdgeModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [leadingEdgeRadius, setLeadingEdgeRadius] = useState(0.015867);
  const [numBernsteinCoefficients, setNumBernsteinCoefficients] = useState(8);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

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

  const handleStartWithDefault = () => {
    // Clear any selected airfoil and navigate to design page
    sessionStorage.removeItem("selectedAirfoil");
    router.push("/design");
  };

  const handleImportFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith(".dat")) {
      alert("Please select a valid .dat file");
      return;
    }

    // Show modal to get leading edge radius
    setSelectedFile(file);
    setShowLeadingEdgeModal(true);

    // Reset file input
    event.target.value = "";
  };

  const handleLeadingEdgeSubmit = async () => {
    if (!selectedFile) return;

    setShowLeadingEdgeModal(false);
    setIsConverting(true);
    setConversionProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setConversionProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("leadingEdgeRadius", leadingEdgeRadius.toString());
      formData.append("numCoefficients", numBernsteinCoefficients.toString());

      const apiUrl = `${PYTHON_BACKEND_URL}${PYTHON_BACKEND_URL?.endsWith("/") ? "" : "/"}get_cst_values`;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (progressInterval) clearInterval(progressInterval);

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch (e2) {
            console.error("Could not parse error response");
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.upperCoefficients || !data.lowerCoefficients) {
        throw new Error("Invalid response: Missing coefficient data");
      }

      // Store the CST coefficients and navigate to design page
      sessionStorage.setItem(
        "cstCoefficients",
        JSON.stringify({
          upper: data.upperCoefficients,
          lower: data.lowerCoefficients,
        }),
      );

      setConversionProgress(100);
      setTimeout(() => {
        setIsConverting(false);
        setConversionProgress(0);
        setSelectedFile(null);
        router.push("/design");
      }, 500);
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(
        `Failed to convert .dat file:\n\n${errorMessage}\n\nCheck console for details.`,
      );

      setIsConverting(false);
      setConversionProgress(0);
      setSelectedFile(null);
    }
  };

  // Filter airfoils based on search query
  const filteredAirfoils = airfoils.filter((airfoil) =>
    airfoil.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredAirfoils.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAirfoils = filteredAirfoils.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getRecentAirfoils = () => {
    // Sort by date modified and get the last 3
    return [...airfoils]
      .sort(
        (a, b) =>
          new Date(b.dateModified).getTime() -
          new Date(a.dateModified).getTime(),
      )
      .slice(0, 3);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {viewMode === "home" ? (
        // HOME VIEW
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 text-6xl font-bold mb-3">
                Turbodiff
              </h1>
              <p className="text-gray-300 text-lg">
                Design, analyze, and optimize airfoils
              </p>
            </div>

            {/* Compact Action Strip */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <button
                onClick={handleStartWithDefault}
                className="group flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-400/50 hover:border-blue-300 rounded-xl transition-all"
                title="Start New Design"
              >
                <Plus className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">New Design</span>
              </button>

              <button
                onClick={handleImportFromFile}
                className="group flex items-center gap-2 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-400/50 hover:border-green-300 rounded-xl transition-all"
                title="Import from File"
              >
                <Upload className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Import File</span>
              </button>

              <button
                onClick={() => setViewMode("saved")}
                className="group flex items-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-cyan-400/50 hover:border-cyan-300 rounded-xl transition-all"
                title="Browse Saved"
              >
                <Database className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-medium">Browse Saved</span>
                <span className="ml-1 px-2 py-0.5 bg-cyan-400/30 rounded-full text-cyan-200 text-xs font-bold">
                  {airfoils.length}
                </span>
              </button>
            </div>

            {/* Recent Designs */}
            {airfoils.length > 0 && (
              <div className="bg-slate-800/30 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Recent Designs
                  </h2>
                  <button
                    onClick={() => setViewMode("saved")}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                  >
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {getRecentAirfoils().map((airfoil) => (
                    <div
                      key={airfoil.id}
                      onClick={() => handleAirfoilClick(airfoil)}
                      className="group flex items-center gap-4 p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-blue-500/20 hover:border-cyan-400/40 rounded-xl cursor-pointer transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-20 h-14 border border-blue-400/30 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                        {airfoil.imageUrl ? (
                          <Image
                            src={airfoil.imageUrl}
                            alt={airfoil.name}
                            width={80}
                            height={56}
                            className="object-contain"
                          />
                        ) : (
                          <Wind className="w-6 h-6 text-blue-400/50" />
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-grow">
                        <h3 className="text-white font-semibold">
                          {airfoil.name}
                        </h3>
                        <p className="text-blue-300/60 text-sm">
                          {formatDate(airfoil.dateModified)}
                        </p>
                      </div>

                      {/* Coefficients */}
                      <div className="flex items-center gap-3">
                        <div className="text-center px-3 py-1 bg-green-500/10 border border-green-400/30 rounded-lg">
                          <div className="text-green-300 text-xs">
                            C<sub>L</sub>
                          </div>
                          <div className="text-green-100 text-sm font-bold">
                            {airfoil.cl.toFixed(3)}
                          </div>
                        </div>
                        <div className="text-center px-3 py-1 bg-orange-500/10 border border-orange-400/30 rounded-lg">
                          <div className="text-orange-300 text-xs">
                            C<sub>D</sub>
                          </div>
                          <div className="text-orange-100 text-sm font-bold">
                            {airfoil.cd.toFixed(3)}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-blue-400/50 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {airfoils.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <p>No saved designs yet. Start creating!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // SAVED AIRFOILS VIEW
        <div className="min-h-screen">
          {/* Sticky Top Bar */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-blue-500/20">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewMode("home")}
                  className="flex items-center gap-2 px-4 py-2 text-white hover:text-cyan-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Home</span>
                </button>
                <div className="text-blue-300 font-semibold">
                  {filteredAirfoils.length} design
                  {filteredAirfoils.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/50 border border-blue-500/30 focus:border-cyan-400/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Airfoil List */}
          <div className="max-w-6xl mx-auto px-4 py-8">
            {currentAirfoils.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-500/10 border-2 border-blue-400/30 flex items-center justify-center">
                  <Database className="w-12 h-12 text-blue-400" />
                </div>
                <div className="text-gray-300 text-xl font-semibold mb-2">
                  {searchQuery ? "No matches found" : "No airfoils yet"}
                </div>
                <div className="text-gray-500 text-sm">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create your first design!"}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {currentAirfoils.map((airfoil, index) => {
                  const globalIndex = startIndex + index + 1;
                  const liftToDrag =
                    airfoil.cd !== 0 ? airfoil.cl / airfoil.cd : 0;

                  return (
                    <div
                      key={airfoil.id}
                      onClick={() => handleAirfoilClick(airfoil)}
                      className="group flex items-center gap-4 p-4 bg-slate-800/30 hover:bg-slate-700/50 border border-blue-500/20 hover:border-cyan-400/40 rounded-xl cursor-pointer transition-all"
                    >
                      {/* Index */}
                      <div className="flex-shrink-0 w-8 text-center text-gray-400 font-mono text-sm">
                        {globalIndex}
                      </div>

                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-24 h-16 border border-blue-400/30 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                        {airfoil.imageUrl ? (
                          <Image
                            src={airfoil.imageUrl}
                            alt={airfoil.name}
                            width={96}
                            height={64}
                            className="object-contain"
                          />
                        ) : (
                          <Wind className="w-8 h-8 text-blue-400/50" />
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {airfoil.name}
                        </h3>
                        <p className="text-blue-300/60 text-sm">
                          {formatDate(airfoil.dateModified)}
                        </p>
                      </div>

                      {/* Coefficients */}
                      <div className="flex items-center gap-3">
                        <div className="text-center px-3 py-1.5 bg-green-500/10 border border-green-400/30 rounded-lg min-w-[70px]">
                          <div className="text-green-300 text-xs font-medium">
                            C<sub>L</sub>
                          </div>
                          <div className="text-green-100 text-sm font-bold">
                            {airfoil.cl.toFixed(3)}
                          </div>
                        </div>
                        <div className="text-center px-3 py-1.5 bg-orange-500/10 border border-orange-400/30 rounded-lg min-w-[70px]">
                          <div className="text-orange-300 text-xs font-medium">
                            C<sub>D</sub>
                          </div>
                          <div className="text-orange-100 text-sm font-bold">
                            {airfoil.cd.toFixed(3)}
                          </div>
                        </div>
                        <div className="text-center px-3 py-1.5 bg-blue-500/10 border border-blue-400/30 rounded-lg min-w-[70px]">
                          <div className="text-blue-300 text-xs font-medium">
                            L/D
                          </div>
                          <div className="text-blue-100 text-sm font-bold">
                            {liftToDrag.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-blue-400/50 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && currentAirfoils.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 1
                      ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
                      : "bg-slate-800/50 text-white hover:bg-blue-600"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                          currentPage === page
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                            : "bg-slate-800/50 text-gray-300 hover:bg-slate-700"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === totalPages
                      ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
                      : "bg-slate-800/50 text-white hover:bg-blue-600"
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Results Info */}
            {filteredAirfoils.length > 0 && (
              <div className="mt-6 text-center text-gray-400 text-sm">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredAirfoils.length)} of{" "}
                {filteredAirfoils.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".dat"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Airfoil Parameters Modal */}
      {showLeadingEdgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Airfoil Parameters
                </h3>
                <p className="text-sm text-gray-600">
                  Configure CST conversion parameters
                </p>
              </div>

              <div className="space-y-5 mb-6">
                {/* Bernstein Coefficients */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Bernstein Coefficients
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={14}
                    value={numBernsteinCoefficients}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 4 && value <= 14) {
                        setNumBernsteinCoefficients(value);
                      }
                    }}
                    className="w-full px-4 py-3 text-lg border-2 border-blue-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Range: 4-14 control points (default: 8)
                  </p>
                </div>

                {/* Leading Edge Radius */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Leading Edge Radius (r<sub>LE</sub>)
                  </label>
                  <input
                    type="text"
                    value={leadingEdgeRadius.toFixed(6)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setLeadingEdgeRadius(value);
                      }
                    }}
                    className="w-full px-4 py-3 text-lg border-2 border-orange-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.015867"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Typical values: 0.005 - 0.02 for most airfoils
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLeadingEdgeModal(false);
                    setSelectedFile(null);
                    setLeadingEdgeRadius(0.015867);
                    setNumBernsteinCoefficients(8);
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeadingEdgeSubmit}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all shadow-md"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Loading Overlay */}
      {isConverting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Settings className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Converting to CST
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Processing airfoil coordinates...
              </p>

              <div className="relative w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${conversionProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {Math.round(conversionProgress)}% complete
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
