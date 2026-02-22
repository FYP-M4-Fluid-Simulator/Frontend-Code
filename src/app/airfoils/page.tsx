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
  Filter,
  ChevronDown,
  Check,
} from "lucide-react";
import { PYTHON_BACKEND_URL } from "@/config";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

// Backend response structure from /cst endpoint
interface Airfoil {
  id: string; // CST ID (UUID as string)
  weights_upper: number[];
  weights_lower: number[];
  chord_length: number;
  cst_created_at: string; // ISO datetime string
  airfoil_created_at: string; // ISO datetime string
  cl: number | null; // Can be null if not yet simulated
  cd: number | null; // Can be null if not yet simulated
  lift: number | null; // Can be null if not yet simulated
  drag: number | null; // Can be null if not yet simulated
  angle_of_attack: number;
  created_by_user_id: string; // UUID as string
  is_optimized: boolean;

  // Display fields (added during transformation)
  name: string; // Generated from ID
  imageUrl?: string; // Optional - may not always be present
  // created_at?: string; // Alias for cst_created_at for compatibility
}

type ViewMode = "home" | "saved";
type FilterType = "all" | "simulated" | "optimized";

export default function AirfoilDeck() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [airfoils, setAirfoils] = useState<Airfoil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const itemsPerPage = 10;

  // Lazy loading states
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const maxRetries = 3;

  // File import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLeadingEdgeModal, setShowLeadingEdgeModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [leadingEdgeRadius, setLeadingEdgeRadius] = useState(0.015867);
  const [numBernsteinCoefficients, setNumBernsteinCoefficients] = useState(8);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  useEffect(() => {
    if (!auth) {
      setUserId("anonymous");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : "anonymous");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAirfoils(false, 0, userId);
    }
  }, [userId]);

  // Handle clicking outside the custom filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAirfoils = async (append = false, retry = 0, currentUserId = userId) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const primaryApiUrl = `${PYTHON_BACKEND_URL}${PYTHON_BACKEND_URL?.endsWith("/") ? "" : "/"}cst?user_id=${currentUserId}`;
      const fallbackApiUrl = "/api/airfoil_deck";

      let response: Response;
      let usedFallback = false;

      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        // Try primary API first
        console.log(`Attempting to fetch from: ${primaryApiUrl}`);

        response = await fetch(primaryApiUrl, {
          signal: controller.signal,
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        console.log(`Primary API response status: ${response.status}`);
        console.log(`Primary API response ok: ${response.ok}`);
        console.log(
          `Primary API response headers:`,
          Object.fromEntries(response.headers.entries()),
        );

        clearTimeout(timeoutId);

        // If primary API fails, try fallback
        if (!response.ok) {
          console.warn(
            `Primary API failed with status ${response.status}, falling back to local API`,
          );

          // Try to log error details before falling back
          try {
            const errorText = await response.clone().text();
            console.error(`Primary API error response body:`, errorText);
          } catch (e) {
            console.error(`Could not read error response body`);
          }

          response = await fetch(fallbackApiUrl);
          usedFallback = true;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.warn(
          "Primary API fetch failed, falling back to local API:",
          fetchError,
        );

        // Try fallback API
        response = await fetch(fallbackApiUrl);
        usedFallback = true;
      }

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;

        // Try to get more detailed error message
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          // If JSON parsing fails, try text
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch (e2) {
            // Use default error message
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Handle both direct array response and object with items property
      let airfoilsArray: any[];

      if (Array.isArray(data)) {
        // Direct array response (for backward compatibility)
        airfoilsArray = data;
      } else if (
        data &&
        typeof data === "object" &&
        "items" in data &&
        Array.isArray(data.items)
      ) {
        // Object with items array (current backend response format)
        airfoilsArray = data.items;
      } else {
        console.error("Invalid response structure. Type:", typeof data);
        console.error("Data value:", data);
        throw new Error(
          "Invalid response format: Expected array or object with 'items' array",
        );
      }

      // Transform data to add display fields and handle null values
      const transformedData: Airfoil[] = airfoilsArray.map(
        (item: any, index: number) => ({
          ...item,
          // Add a generated name if not present
          name: item.name || `Airfoil ${item.id.substring(0, 8)}`,
          // Add created_at alias for compatibility
          created_at: item.cst_created_at,
        }),
      );

      if (append) {
        setAirfoils((prev) => [...prev, ...transformedData]);
      } else {
        setAirfoils(transformedData);
      }

      // Update fallback state
      setUsingFallback(usedFallback);

      // Check if there's more data (you can adjust this logic based on your API)
      setHasMore(airfoilsArray.length >= itemsPerPage && !usedFallback); // Don't allow load more for dummy data
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching airfoils:", err);

      let errorMessage = "Failed to load airfoils";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Request timeout: Server took too long to respond";
        } else if (err.message.includes("fetch")) {
          errorMessage = "Network error: Please check your connection";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // Retry logic with exponential backoff
      if (retry < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retry), 10000); // Max 10 seconds
        setRetryCount(retry + 1);

        console.log(
          `Retrying in ${retryDelay}ms... (Attempt ${retry + 1}/${maxRetries})`,
        );

        setTimeout(() => {
          fetchAirfoils(append, retry + 1);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setUsingFallback(false);
    fetchAirfoils();
  };

  const loadMoreAirfoils = () => {
    if (!loadingMore && hasMore) {
      fetchAirfoils(true);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatValue = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "N/A";
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

  const handleAirfoilClick = (airfoil: Airfoil) => {
    // Store selected airfoil data for design page
    sessionStorage.setItem(
      "selectedAirfoil",
      JSON.stringify({
        id: airfoil.id,
        name: airfoil.name,
        upperCoefficients: airfoil.weights_upper,
        lowerCoefficients: airfoil.weights_lower,
        chordLength: airfoil.chord_length,
        angleOfAttack: airfoil.angle_of_attack,
        cl: airfoil.cl,
        cd: airfoil.cd,
      }),
    );
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

      const apiUrl = `${PYTHON_BACKEND_URL}${PYTHON_BACKEND_URL?.endsWith("/") ? "" : "/"}get_cst_values?user_id=${userId}`;

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

  // Filter airfoils based on search query and type
  const filteredAirfoils = airfoils.filter((airfoil) => {
    const matchesSearch = airfoil.name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (filterType === "simulated") {
      // It's simulated if it has simulation data but is NOT optimized
      const hasSimData = airfoil.cl !== null && airfoil.cd !== null && airfoil.cd !== 0;
      matchesFilter = hasSimData && !airfoil.is_optimized;
    } else if (filterType === "optimized") {
      matchesFilter = airfoil.is_optimized;
    }

    return matchesSearch && matchesFilter;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAirfoils.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAirfoils = filteredAirfoils.slice(startIndex, endIndex);

  // Reset to page 1 when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getRecentAirfoils = () => {
    // Sort by date modified and get the last 3
    return [...airfoils]
      .sort(
        (a, b) =>
          new Date(b.airfoil_created_at).getTime() - new Date(a.airfoil_created_at).getTime(),
      )
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-white text-xl font-semibold mb-2">
            {retryCount > 0
              ? `Retrying... (${retryCount}/${maxRetries})`
              : "Loading airfoils..."}
          </div>
          <div className="text-blue-300/60 text-sm">
            {retryCount > 0
              ? "Previous attempt failed, trying again"
              : "Please wait while we fetch your designs"}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border-2 border-red-400/30 flex items-center justify-center">
            <div className="text-red-400 text-4xl">⚠️</div>
          </div>
          <div className="text-red-400 text-xl font-semibold mb-3">
            Failed to Load Airfoils
          </div>
          <div className="text-red-300/80 mb-6 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            {error}
          </div>
          {retryCount > 0 && retryCount < maxRetries && (
            <div className="text-yellow-300 text-sm mb-4">
              Retrying... (Attempt {retryCount}/{maxRetries})
            </div>
          )}
          <button
            onClick={handleRetry}
            disabled={retryCount > 0 && retryCount < maxRetries}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg"
          >
            {retryCount > 0 && retryCount < maxRetries
              ? "Retrying..."
              : "Try Again"}
          </button>
          <div className="mt-4 text-gray-400 text-xs">
            Make sure your backend server is running
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Fallback Data Warning Banner */}
      {usingFallback && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-yellow-400 text-sm">⚠</span>
            </div>
            <div className="flex-grow">
              <p className="text-yellow-200 text-sm font-medium">
                Using demo data - Backend server unavailable
              </p>
              <p className="text-yellow-300/70 text-xs">
                Displaying sample airfoils for demonstration purposes
              </p>
            </div>
            <button
              onClick={() => {
                setUsingFallback(false);
                fetchAirfoils();
              }}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-yellow-200 hover:text-yellow-100 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {viewMode === "home" ? (
        // HOME VIEW
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 text-6xl font-bold mb-3">
                TurboDiff
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
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${usingFallback
                    ? "bg-yellow-400/30 text-yellow-200"
                    : "bg-cyan-400/30 text-cyan-200"
                    }`}
                >
                  {airfoils.length}
                  {usingFallback && " (demo)"}
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold flex-shrink-0">
                            {airfoil.name}
                          </h3>
                          {airfoil.is_optimized && (
                            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded text-[10px] font-bold text-purple-300 uppercase tracking-wider flex-shrink-0 relative -top-px">
                              Optimized
                            </span>
                          )}
                        </div>
                        <p className="text-blue-300/60 text-sm mt-0.5">
                          {formatDate(airfoil.airfoil_created_at)}
                        </p>
                      </div>

                      {/* Coefficients */}
                      <div className="flex items-center gap-3">
                        <div className="text-center px-3 py-1 bg-green-500/10 border border-green-400/30 rounded-lg min-w-28">
                          <div className="text-green-300 text-xs font-medium">
                            C<sub>L</sub>
                          </div>
                          <div className="text-green-100 text-sm font-bold">
                            {formatValue(airfoil.cl)}
                          </div>
                        </div>
                        <div className="text-center px-3 py-1 bg-orange-500/10 border border-orange-400/30 rounded-lg min-w-28">
                          <div className="text-orange-300 text-xs font-medium">
                            C<sub>D</sub>
                          </div>
                          <div className="text-orange-100 text-sm font-bold">
                            {formatValue(airfoil.cd)}
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

              {/* Search Bar and Filter Dropdown */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
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

                {/* Filter Dropdown */}
                <div className="sm:w-52 flex-shrink-0 relative" ref={filterDropdownRef}>
                  <button
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="w-full h-full flex items-center justify-between pl-10 pr-4 py-2.5 bg-slate-800/50 border border-blue-500/30 hover:border-cyan-400/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all font-medium"
                  >
                    <span>
                      {filterType === "all"
                        ? "All Designs"
                        : filterType === "simulated"
                          ? "Simulated Only"
                          : "Optimized Only"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isFilterDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />

                  {/* Dropdown Menu */}
                  {isFilterDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-full bg-slate-800 border border-blue-500/30 rounded-lg shadow-xl overflow-hidden z-50">
                      {[
                        { value: "all", label: "All Designs" },
                        { value: "simulated", label: "Simulated Only" },
                        { value: "optimized", label: "Optimized Only" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilterType(option.value as FilterType);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${filterType === option.value
                              ? "bg-blue-500/20 text-cyan-400 font-medium"
                              : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
                            }`}
                        >
                          {option.label}
                          {filterType === option.value && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                  {searchQuery || filterType !== "all" ? "No matches found" : "No airfoils yet"}
                </div>
                <div className="text-gray-500 text-sm">
                  {searchQuery || filterType !== "all"
                    ? "Try a different search or filter"
                    : "Create your first design!"}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {currentAirfoils.map((airfoil, index) => {
                  const globalIndex = startIndex + index + 1;
                  const hasSimulationData =
                    airfoil.cl !== null &&
                    airfoil.cd !== null &&
                    airfoil.cd !== 0;
                  const liftToDrag = hasSimulationData
                    ? airfoil.cl! / airfoil.cd!
                    : null;

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
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold truncate flex-shrink-0">
                            {airfoil.name}
                          </h3>
                          {airfoil.is_optimized && (
                            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded text-[10px] font-bold text-purple-300 uppercase tracking-wider flex-shrink-0 relative -top-px">
                              Optimized
                            </span>
                          )}
                        </div>
                        <p className="text-blue-300/60 text-sm mt-0.5">
                          {formatDate(airfoil.airfoil_created_at)}
                        </p>
                      </div>

                      {/* Coefficients */}
                      <div className="flex items-center gap-3">
                        <div className="text-center px-3 py-1.5 bg-green-500/10 border border-green-400/30 rounded-lg min-w-28">
                          <div className="text-green-300 text-xs font-medium">
                            C<sub>L</sub>
                          </div>
                          <div className="text-green-100 text-sm font-bold">
                            {formatValue(airfoil.cl)}
                          </div>
                        </div>
                        <div className="text-center px-3 py-1.5 bg-orange-500/10 border border-orange-400/30 rounded-lg min-w-28">
                          <div className="text-orange-300 text-xs font-medium">
                            C<sub>D</sub>
                          </div>
                          <div className="text-orange-100 text-sm font-bold">
                            {formatValue(airfoil.cd)}
                          </div>
                        </div>
                        <div className="text-center px-3 py-1.5 bg-blue-500/10 border border-blue-400/30 rounded-lg min-w-28">
                          <div className="text-blue-300 text-xs font-medium">
                            L/D
                          </div>
                          <div className="text-blue-100 text-sm font-bold">
                            {formatValue(liftToDrag)}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-blue-400/50 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {currentAirfoils.length > 0 && hasMore && !searchQuery && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMoreAirfoils}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      <span>Load More Airfoils</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && currentAirfoils.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${currentPage === 1
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
                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${currentPage === page
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
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${currentPage === totalPages
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
                {!hasMore && !searchQuery && (
                  <div className="text-green-400 mt-2">
                    ✓ All airfoils loaded
                  </div>
                )}
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
