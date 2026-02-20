// import { NextRequest, NextResponse } from "next/server";

// /**
//  * API Route: CST Coefficient Update
//  *
//  * This endpoint handles real-time updates to CST (Class Shape Transformation) coefficients
//  * and recalculates the complete airfoil geometry using Bernstein polynomials.
//  *
//  * POST /api/cst/update
//  * Body: { upperWeights: number[], lowerWeights: number[], numPoints?: number, trailingEdgeThickness?: number }
//  * Returns: { success: true, coordinates: Array<{x: number, y: number}>, upperCoordinates: Array<{x: number, y: number}>, lowerCoordinates: Array<{x: number, y: number}> }
//  */

// // Helper: Calculate factorial
// const factorial = (n: number): number => {
//   if (n <= 1) return 1;
//   let result = 1;
//   for (let i = 2; i <= n; i++) {
//     result *= i;
//   }
//   return result;
// };

// // Helper: Calculate Binomial Coefficient (nCr) - K in the Python code
// const nCr = (n: number, r: number): number => {
//   if (r < 0 || r > n) return 0;
//   if (r === 0 || r === n) return 1;
//   return factorial(n) / (factorial(r) * factorial(n - r));
// };

// // Class Shape Function - matches the Python implementation
// function classShape(
//   weights: number[],
//   x: number[],
//   dz: number,
//   N1 = 0.5,
//   N2 = 1.0,
// ) {
//   const n = weights.length - 1; // Order of Bernstein polynomial

//   // Pre-compute Bernstein coefficients (the 'K' in Python)
//   const K = Array.from({ length: n + 1 }, (_, i) => nCr(n, i));

//   // Calculate y-coordinates for each x
//   return x.map((xi) => {
//     // 1. Class Function
//     const C = Math.pow(xi, N1) * Math.pow(1 - xi, N2);

//     // 2. Shape Function (Bernstein Polynomial)
//     let S = 0;
//     for (let j = 0; j <= n; j++) {
//       S += weights[j] * K[j] * Math.pow(xi, j) * Math.pow(1 - xi, n - j);
//     }

//     // 3. Calculate final y-coordinate
//     // y = C * S + x * dz
//     return C * S + xi * dz;
//   });
// }

// // Generate complete CST airfoil - matches Python cst_airfoil function
// function generateCSTAirfoil(
//   upperWeights: number[],
//   lowerWeights: number[],
//   dz = 0,
//   N = 100,
// ) {
//   // 1. Generate x-coordinates using cosine spacing (like in Python)
//   const zeta = Array.from({ length: N + 1 }, (_, i) => ((2 * Math.PI) / N) * i);
//   const x = zeta.map((z) => 0.5 * (Math.cos(z) + 1));

//   // 2. Find the leading edge (LE) index
//   const zerind = x.indexOf(Math.min(...x));

//   // 3. Split x-coordinates for lower and upper surfaces
//   const xl = x.slice(0, zerind); // Lower surface x-coordinates
//   const xu = x.slice(zerind); // Upper surface x-coordinates

//   // 4. Calculate y-coordinates for both surfaces
//   const yl = classShape(lowerWeights, xl, -dz, 0.5, 1.0); // Lower surface
//   const yu = classShape(upperWeights, xu, dz, 0.5, 1.0); // Upper surface

//   // 5. Combine coordinates
//   const y = [...yl, ...yu];

//   // print x, y values
//   // for (let i = 0; i < x.length; i++) {
//   //   console.log(`x[${i}] = ${x[i]}, y[${i}] = ${y[i]}`);
//   // }


//   // Create coordinate arrays
//   const coordinates = x.map((xi, i) => ({ x: xi, y: y[i] }));
//   const upperCoordinates = xu.map((xi, i) => ({ x: xi, y: yu[i] }));
//   const lowerCoordinates = xl.map((xi, i) => ({ x: xi, y: yl[i] }));

//   return {
//     coordinates,
//     upperCoordinates,
//     lowerCoordinates,
//   };
// }

// export async function POST(request: NextRequest) {
//   try {
//     const {
//       upperWeights,
//       lowerWeights,
//       numPoints = 100,
//       trailingEdgeThickness = 0,
//     } = await request.json();

//     // Validate weights arrays
//     if (!upperWeights || !Array.isArray(upperWeights)) {
//       return NextResponse.json(
//         {
//           error: "Invalid upperWeights array",
//         },
//         { status: 400 },
//       );
//     }

//     if (!lowerWeights || !Array.isArray(lowerWeights)) {
//       return NextResponse.json(
//         {
//           error: "Invalid lowerWeights array",
//         },
//         { status: 400 },
//       );
//     }

//     if (upperWeights.length === 0 || lowerWeights.length === 0) {
//       return NextResponse.json(
//         {
//           error: "Weight arrays cannot be empty",
//         },
//         { status: 400 },
//       );
//     }

//     // Validate coefficient ranges (typically -1 to 1)
//     const invalidUpperCoeffs = upperWeights.filter(
//       (w) => typeof w !== "number" || w < -1 || w > 1,
//     );
//     const invalidLowerCoeffs = lowerWeights.filter(
//       (w) => typeof w !== "number" || w < -1 || w > 1,
//     );

//     if (invalidUpperCoeffs.length > 0 || invalidLowerCoeffs.length > 0) {
//       return NextResponse.json(
//         {
//           error: "CST coefficients must be numbers between -1 and 1",
//         },
//         { status: 400 },
//       );
//     }

//     // Generate complete airfoil using CST algorithm
//     const result = generateCSTAirfoil(
//       upperWeights,
//       lowerWeights,
//       trailingEdgeThickness,
//       numPoints,
//     );

//     console.log(
//       `[CST API] Generated complete airfoil with ${upperWeights.length} upper and ${lowerWeights.length} lower coefficients`,
//     );

//     return NextResponse.json({
//       success: true,
//       coordinates: result.coordinates,
//       upperCoordinates: result.upperCoordinates,
//       lowerCoordinates: result.lowerCoordinates,
//       numUpperCoefficients: upperWeights.length,
//       numLowerCoefficients: lowerWeights.length,
//       numPoints: result.coordinates.length,
//       trailingEdgeThickness,
//     });
//   } catch (error) {
//     console.error("[CST API Error]:", error);
//     return NextResponse.json(
//       {
//         error: "Calculation failed",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 },
//     );
//   }
// }

// // export async function GET() {
// //   return NextResponse.json({
// //     message: "CST Update API",
// //     method: "POST",
// //     endpoint: "/api/cst/update",
// //     requestBody: {
// //       upperWeights: "number[] (upper surface coefficients between -1 and 1)",
// //       lowerWeights: "number[] (lower surface coefficients between -1 and 1)",
// //       numPoints:
// //         "number (optional, default: 100) - number of points to generate",
// //       trailingEdgeThickness:
// //         "number (optional, default: 0) - trailing edge thickness",
// //     },
// //     responseBody: {
// //       success: "boolean",
// //       coordinates:
// //         "Array<{x: number, y: number}> - complete airfoil coordinates",
// //       upperCoordinates: "Array<{x: number, y: number}> - upper surface only",
// //       lowerCoordinates: "Array<{x: number, y: number}> - lower surface only",
// //       numUpperCoefficients: "number",
// //       numLowerCoefficients: "number",
// //       numPoints: "number",
// //       trailingEdgeThickness: "number",
// //     },
// //     example: {
// //       request: {
// //         upperWeights: [0.17104533, 0.15300564, 0.1501825, 0.135824, 0.14169314],
// //         lowerWeights: [
// //           -0.17104533, -0.15300564, -0.1501825, -0.135824, -0.14169314,
// //         ],
// //         numPoints: 100,
// //         trailingEdgeThickness: 0,
// //       },
// //       response: {
// //         success: true,
// //         coordinates: [{ x: 1, y: 0 }, "..."],
// //         upperCoordinates: [{ x: 1, y: 0 }, "..."],
// //         lowerCoordinates: [{ x: 1, y: 0 }, "..."],
// //         numUpperCoefficients: 5,
// //         numLowerCoefficients: 5,
// //         numPoints: 101,
// //         trailingEdgeThickness: 0,
// //       },
// //     },
// //     notes: [
// //       "This API implements the complete CST (Class Shape Transformation) algorithm",
// //       "Both upper and lower weights are required to generate a complete airfoil",
// //       "Lower weights are typically negative values for conventional airfoils",
// //       "The algorithm uses cosine spacing for x-coordinates to ensure proper clustering near leading/trailing edges",
// //       "Coordinates are returned in order from trailing edge, around the airfoil, back to trailing edge",
// //     ],
// //   });
// // }
