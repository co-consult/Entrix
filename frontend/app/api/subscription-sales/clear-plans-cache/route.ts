import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Call the backend endpoint to clear the cache
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription-sales/clear-plans-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      data: result
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clear cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 