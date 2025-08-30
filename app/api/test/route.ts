import { NextResponse } from "next/server";

// Simple test endpoint to verify API is working
export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: "API is working",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    ok: true, 
    message: "POST method working",
    timestamp: new Date().toISOString()
  });
}
