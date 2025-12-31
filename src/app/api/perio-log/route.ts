import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  console.log(`[PERIO] ${JSON.stringify(body)}`);
  return NextResponse.json({ success: true });
} 