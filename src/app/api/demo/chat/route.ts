import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory rate limiter: max 10 messages per IP per hour
const ipRequests = new Map<string, { count: number; resetAt: number }>();

const SYSTEM_PROMPT = `You are Max, a friendly AI sales agent for PoolPro — a pool cleaning and maintenance company. You help homeowners get a free quote and schedule service.

Your job:
1. Greet the lead warmly and ask about their pool
2. Ask qualifying questions naturally (pool size, type, location, current issues)
3. Once you have enough info, give a ballpark quote ($120–$350/mo depending on size)
4. Try to book a free on-site assessment

Rules:
- Keep messages SHORT — 1-3 sentences max
- Sound human and conversational, never robotic
- Never make up specific prices beyond your range
- If asked something off-topic, redirect to pool service
- After 4-5 exchanges, suggest scheduling: "I can get someone out to your place for a free assessment this week. What works best — morning or afternoon?"`;

function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const now = Date.now();

  // Rate limit check
  const entry = ipRequests.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 10) {
      return Response.json(
        { error: "Rate limit reached. Try again later." },
        { status: 429 }
      );
    }
    entry.count++;
  } else {
    ipRequests.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  // Validate and sanitize messages (max 20)
  const sanitized = messages.slice(-20).map((m: unknown) => {
    const msg = m as { role?: string; content?: string };
    return {
      role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(msg.content ?? "").slice(0, 500),
    };
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    // Return a canned response in dev if no API key
    return Response.json({
      reply: "Hey! I'm Max from PoolPro. Tell me about your pool — is it above-ground or in-ground?",
    });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: sanitized,
    });

    const reply =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return Response.json({ reply });
  } catch {
    return Response.json(
      { error: "AI unavailable. Please try again." },
      { status: 503 }
    );
  }
}
