// import { NextRequest, NextResponse } from "next/server";

// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     if (!file.name.endsWith(".dat")) {
//       return NextResponse.json(
//         { error: "Invalid file type. Only .dat files are supported." },
//         { status: 400 },
//       );
//     }

//     // Read file content
//     const fileContent = await file.text();

//     // Parse .dat file (typical airfoil coordinate format)
//     const lines = fileContent.trim().split("\n");
//     const coords: { x: number; y: number }[] = [];

//     // Skip header line if it exists (non-numeric first line)
//     let startIndex = 0;
//     if (isNaN(parseFloat(lines[0].trim().split(/\s+/)[0]))) {
//       startIndex = 1;
//     }

//     for (let i = startIndex; i < lines.length; i++) {
//       const line = lines[i].trim();
//       if (line === "") continue;

//       const parts = line.split(/\s+/);
//       if (parts.length >= 2) {
//         const x = parseFloat(parts[0]);
//         const y = parseFloat(parts[1]);
//         if (!isNaN(x) && !isNaN(y)) {
//           coords.push({ x, y });
//         }
//       }
//     }

//     if (coords.length === 0) {
//       return NextResponse.json(
//         { error: "No valid coordinates found in file" },
//         { status: 400 },
//       );
//     }

//     // Simple CST coefficient estimation
//     // This is a basic implementation - in production you'd use more sophisticated curve fitting
//     const upperCoefficients = estimateUpperCST(coords);
//     const lowerCoefficients = estimateLowerCST(coords);

//     return NextResponse.json({
//       upperCoefficients,
//       lowerCoefficients,
//       message: "File converted successfully",
//     });
//   } catch (error) {
//     console.error("Error processing file:", error);
//     return NextResponse.json(
//       { error: "Failed to process file" },
//       { status: 500 },
//     );
//   }
// }

// function estimateUpperCST(coords: { x: number; y: number }[]): number[] {
//   // Find upper surface points (y >= 0 or first half if closed loop)
//   const sortedCoords = coords.sort((a, b) => a.x - b.x);
//   const midIndex = Math.floor(sortedCoords.length / 2);

//   // Simple estimation based on airfoil shape characteristics
//   const maxThickness = Math.max(...sortedCoords.map((p) => p.y));
//   const leadingEdgeRadius = sortedCoords.find((p) => p.x <= 0.1)?.y || 0;
//   const trailingEdge = sortedCoords[sortedCoords.length - 1]?.y || 0;

//   return [
//     Math.max(0.05, Math.min(0.3, leadingEdgeRadius * 2)),
//     Math.max(0.1, Math.min(0.4, maxThickness * 1.5)),
//     Math.max(0.05, Math.min(0.25, maxThickness)),
//     Math.max(0.02, Math.min(0.15, Math.abs(trailingEdge) * 2)),
//     Math.max(0.01, Math.min(0.1, Math.abs(trailingEdge))),
//   ];
// }

// function estimateLowerCST(coords: { x: number; y: number }[]): number[] {
//   // Find lower surface points (y < 0 or second half if closed loop)
//   const sortedCoords = coords.sort((a, b) => a.x - b.x);

//   const minThickness = Math.min(...sortedCoords.map((p) => p.y));
//   const leadingEdgeRadius = sortedCoords.find((p) => p.x <= 0.1)?.y || 0;
//   const trailingEdge = sortedCoords[sortedCoords.length - 1]?.y || 0;

//   return [
//     Math.max(-0.2, Math.min(-0.05, leadingEdgeRadius * -1.5)),
//     Math.max(-0.3, Math.min(-0.08, minThickness * 1.2)),
//     Math.max(-0.2, Math.min(-0.05, minThickness * 0.8)),
//     Math.max(-0.12, Math.min(-0.02, trailingEdge * -1.5)),
//     Math.max(-0.08, Math.min(-0.01, trailingEdge * -1.2)),
//   ];
// }
