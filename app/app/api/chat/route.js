export async function POST(request) {
  try {
    const { messages, system } = await request.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: system,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await response.json();

    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 400 });
    }

    const text = data.content?.[0]?.text || "";

    return Response.json({ message: text });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
