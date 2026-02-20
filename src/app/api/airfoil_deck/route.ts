import { NextResponse } from "next/server";
import { PYTHON_BACKEND_URL } from "@/config";

export async function GET() {
  // For now, return dummy data. Later, this will fetch from the Python backend
  // const backendUrl = `${PYTHON_BACKEND_URL}/airfoils`;

  try {
    // Uncomment when backend is ready:
    // const response = await fetch(backendUrl, {
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   cache: 'no-store',
    // });
    //
    // if (response.ok) {
    //   const data = await response.json();
    //   return NextResponse.json(data);
    // }

    // For now, return dummy data directly
    console.log("Returning dummy airfoil data");

    // Mock data for development/testing
    const mockData = [
      {
        id: "1",
        name: "NACA 2412",
        imageUrl: "/sample_airfoil_img.png", // Will show placeholder text
        cl: 1.234,
        cd: 0.012,
        dateModified: new Date().toISOString(),
      },
      {
        id: "2",
        name: "NACA 4412",
        imageUrl:  "/sample_airfoil_img.png", 
        cl: 1.456,
        cd: 0.015,
        dateModified: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "3",
        name: "Clark Y",
        imageUrl:  "/sample_airfoil_img.png", 
        cl: 1.125,
        cd: 0.011,
        dateModified: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "4",
        name: "Eppler 423",
        imageUrl:  "/sample_airfoil_img.png", 
        cl: 1.678,
        cd: 0.018,
        dateModified: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "5",
        name: "Custom Design 1",
        imageUrl:  "/sample_airfoil_img.png", 
        cl: 1.523,
        cd: 0.014,
        dateModified: new Date(Date.now() - 345600000).toISOString(),
      },
    ];

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error in airfoil deck API:", error);
    return NextResponse.json(
      { error: "Failed to fetch airfoils" },
      { status: 500 },
    );
  }
}
