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

    // Mock data for development/testing - matches Airfoil interface
    const mockData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        cst_id: "550e8400-e29b-41d4-a716-446655440011",
        session_id: "550e8400-e29b-41d4-a716-446655440021",
        name: "NACA 2412",
        is_optimized: false,
        cl: 1.234,
        cd: 0.012,
        lift: 185.1,
        drag: 1.8,
        angle_of_attack: 5.0,
        created_by_user_id: "550e8400-e29b-41d4-a716-446655440031",
        created_at: new Date().toISOString(),
        imageUrl: "/sample_airfoil_img.png",
        dateModified: new Date().toISOString(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        cst_id: "550e8400-e29b-41d4-a716-446655440012",
        session_id: "550e8400-e29b-41d4-a716-446655440022",
        name: "NACA 4412",
        is_optimized: true,
        cl: 1.456,
        cd: 0.015,
        lift: 218.4,
        drag: 2.25,
        angle_of_attack: 6.0,
        created_by_user_id: "550e8400-e29b-41d4-a716-446655440031",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        imageUrl: "/sample_airfoil_img.png",
        dateModified: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        cst_id: "550e8400-e29b-41d4-a716-446655440013",
        session_id: "550e8400-e29b-41d4-a716-446655440023",
        name: "Clark Y",
        is_optimized: false,
        cl: 1.125,
        cd: 0.011,
        lift: 168.75,
        drag: 1.65,
        angle_of_attack: 4.5,
        created_by_user_id: "550e8400-e29b-41d4-a716-446655440031",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        imageUrl: "/sample_airfoil_img.png",
        dateModified: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        cst_id: "550e8400-e29b-41d4-a716-446655440014",
        session_id: "550e8400-e29b-41d4-a716-446655440024",
        name: "Eppler 423",
        is_optimized: true,
        cl: 1.678,
        cd: 0.018,
        lift: 251.7,
        drag: 2.7,
        angle_of_attack: 7.0,
        created_by_user_id: "550e8400-e29b-41d4-a716-446655440031",
        created_at: new Date(Date.now() - 259200000).toISOString(),
        imageUrl: "/sample_airfoil_img.png",
        dateModified: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        cst_id: "550e8400-e29b-41d4-a716-446655440015",
        session_id: "550e8400-e29b-41d4-a716-446655440025",
        name: "Custom Design 1",
        is_optimized: false,
        cl: 1.523,
        cd: 0.014,
        lift: 228.45,
        drag: 2.1,
        angle_of_attack: 5.5,
        created_by_user_id: "550e8400-e29b-41d4-a716-446655440031",
        created_at: new Date(Date.now() - 345600000).toISOString(),
        imageUrl: "/sample_airfoil_img.png",
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
