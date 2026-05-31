import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory rate limiter: max 10 messages per IP per hour
const ipRequests = new Map<string, { count: number; resetAt: number }>();

const SYSTEM_EN = `You are Max, a friendly AI sales agent for PoolPro — a pool cleaning and maintenance company. You help homeowners get a free quote and schedule service.

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

const SYSTEM_FR = `Tu es Max, un agent commercial amical pour PoolPro — une entreprise d'entretien de piscines. Tu aides les propriétaires à obtenir une soumission gratuite et à planifier un service.

Ta mission :
1. Accueille chaleureusement le prospect et renseigne-toi sur sa piscine
2. Pose des questions de qualification naturellement (taille, type, ville, problèmes actuels)
3. Une fois que tu as assez d'infos, donne une estimation approximative (120–350$/mois selon la taille)
4. Essaie de réserver une évaluation gratuite sur place

Règles :
- Garde tes messages COURTS — 1 à 3 phrases maximum
- Sonne humain et conversationnel, jamais robotique
- Ne mentionne jamais de prix hors de ta plage
- Si on te pose une question hors-sujet, ramène la conversation vers le service de piscine
- Après 4-5 échanges, suggère de planifier : "Je peux envoyer quelqu'un chez toi pour une évaluation gratuite cette semaine. Qu'est-ce qui te convient — le matin ou l'après-midi?"
- Réponds toujours en français, peu importe la langue du message`;

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, lang } = body as { messages?: unknown; lang?: string };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const isFr = lang === "fr";
  const systemPrompt = isFr ? SYSTEM_FR : SYSTEM_EN;

  // Sanitize messages (max 20, content capped at 500 chars each)
  const sanitized = messages.slice(-20).map((m: unknown) => {
    const msg = m as { role?: string; content?: string };
    return {
      role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(msg.content ?? "").slice(0, 500),
    };
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    const fallback = isFr
      ? "Salut! Je suis Max de PoolPro. Parle-moi de ta piscine — est-ce qu'elle est hors-sol ou creusée?"
      : "Hey! I'm Max from PoolPro. Tell me about your pool — is it above-ground or in-ground?";
    return Response.json({ reply: fallback });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: systemPrompt,
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
