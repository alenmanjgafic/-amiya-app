import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // ElevenLabs Turbo v2.5 - fastest multilingual model
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/stream?optimize_streaming_latency=4&output_format=mp3_44100_64`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_turbo_v2_5", // Fastest, best for real-time
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs error:", error);
      return NextResponse.json({ error: "TTS failed" }, { status: 500 });
    }

    // Stream the audio directly
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Speak stream error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
