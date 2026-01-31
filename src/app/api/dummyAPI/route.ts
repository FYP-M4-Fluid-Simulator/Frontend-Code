import { NextRequest, NextResponse } from 'next/server';

// Mock data for testing
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' },
];

const mockTurbineData = [
  { id: 1, name: 'Turbine A', efficiency: 85.2, power: 2500, status: 'active' },
  { id: 2, name: 'Turbine B', efficiency: 92.1, power: 3200, status: 'active' },
  { id: 3, name: 'Turbine C', efficiency: 78.5, power: 1800, status: 'maintenance' },
];

// GET - Retrieve data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const delay = searchParams.get('delay');

  // Simulate network delay for testing
  if (delay) {
    await new Promise(resolve => setTimeout(resolve, parseInt(delay)));
  }

  // Return different mock data based on type parameter
  switch (type) {
    case 'users':
      return NextResponse.json({ 
        success: true,
        data: mockUsers,
        total: mockUsers.length,
        timestamp: Date.now()
      });
    
    case 'turbines':
      return NextResponse.json({ 
        success: true,
        data: mockTurbineData,
        total: mockTurbineData.length,
        timestamp: Date.now()
      });
    
    case 'error':
      return NextResponse.json(
        { success: false, error: 'Simulated error for testing' },
        { status: 500 }
      );
    
    default:
      return NextResponse.json({
        success: true,
        message: 'Hello from the dummy API!',
        timestamp: Date.now(),
        availableEndpoints: [
          'GET /?type=users - Get mock user data',
          'GET /?type=turbines - Get mock turbine data',
          'GET /?type=error - Simulate error response',
          'GET /?delay=1000 - Add delay for testing',
          'POST / - Create new item',
          'PUT / - Update item',
          'DELETE / - Delete item'
        ]
      });
  }
}

// POST - Create new data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Simulate creating new item
    const newItem = {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    }, { status: 201 });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
}

// PUT - Update data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    // Simulate updating item
    const updatedItem = {
      id: parseInt(id),
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
}

// DELETE - Remove data
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID parameter is required' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Item with ID ${id} deleted successfully`,
    deletedId: parseInt(id)
  });
}
