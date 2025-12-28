import { NextResponse } from "next/server";

export async function GET() {
  // Return the API key directly for WebSocket auth
  // In production, you might want to use Deepgram's temporary token API
  return NextResponse.json({ 
    token: process.env.DEEPGRAM_API_KEY 
  });
}
