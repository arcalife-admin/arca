import { NextResponse } from 'next/server';

// Dental codes API removed - not applicable for plastic surgery
// Use surgical procedure codes instead (/api/surgical-procedure-codes)

export async function GET(request: Request) {
  // Return empty array since dental codes are no longer used
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  // Dental codes creation disabled - not applicable for plastic surgery
  return NextResponse.json(
    { error: 'Dental codes are not available. Use surgical procedure codes instead.' },
    { status: 400 }
  );
} 