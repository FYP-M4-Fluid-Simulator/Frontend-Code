// lib/constants.ts
export const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL;
export const WS_BACKEND_URL = process.env.NEXT_PUBLIC_WS_BASE;

// Debug logging (only runs once when module is imported)
if (typeof window !== "undefined") {
  console.log("🔧 Config loaded:", {
    PYTHON_BACKEND_URL,
    WS_BACKEND_URL,
  });
}

export const GRID = {
  WIDTH: 256,
  HEIGHT: 128,
  CELL: 4,
};
