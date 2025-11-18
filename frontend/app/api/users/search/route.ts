import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    message: 'This endpoint is deprecated. Use direct backend calls instead.' 
  }, { status: 404 });
} 