import { NextResponse } from 'next/server';

// Dental codes bulk API removed - not applicable for plastic surgery
// Use surgical procedure codes instead

export async function POST(request: Request) {
  // Dental codes bulk creation disabled - not applicable for plastic surgery
  return NextResponse.json(
    { error: 'Dental codes are not available. Use surgical procedure codes instead.' },
    { status: 400 }
  );
} 