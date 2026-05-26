import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient } from "@/lib/claude";
import twilio from "twilio";

// Twilio sends application/x-www-form-urlencoded
export async function POST(request: Request) {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const body = params.get("Body") ?? "";
  const from = params.get("From") ?? "";
  const to = params.get("To") ?? "";

  if (!from || !to) {
    return new Response("<Response/>", {
      status: 400,
      headers: { "Content-Type": "text/xml" },
    });
  }

  const supabase = createAdminClient();

  // 1. Find agent by phone number (To = the agent's Twilio number)
  const { data: agents, error: agentError } = await supabase
    .from("agents")
    .select(
      "id, business_name, sector, services, tone, language, phone, twilio_account_sid, twilio_auth_token"
    )
    .eq("phone", to)
    .limit(1);

  if (agentError || !agents || agents.length === 0) {
    console.error("Agent not found for phone:", to, agentError);
    return new Response("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  const agent = agents[0] as {
    id: string;
    business_name: string;
    sector: string;
    services: string;
    tone: string;
    language: string;
    phone: string;
    twilio_account_sid: string | null;
    twilio_auth_token: string | null;
  };

  // 2. Fetch last 10 messages from this contact for conversation context
  const { data: history } = await supabase
    .from("conversations")
    .select("role, last_message, created_at")
    .eq("agent_id", agent.id)
    .eq("contact_phone", from)
    .order("created_at", { ascending: true })
    .limit(10);

  // 3. Build system prompt
  const systemPrompt = `Tu es l'assistant virtuel de ${agent.business_name}, une entreprise de ${agent.sector}.
Ton rôle est de qualifier les leads, répondre aux questions et aider à closer des clients.
Services offerts: ${agent.services}.
Ton ton: ${agent.tone}. Langue principale: ${agent.language}.
Tu communiques par SMS — sois concis, max 2-3 phrases par message.
Ne mentionne jamais que tu es une IA sauf si on te le demande directement.`;

  // 4. Build messages array for Claude (alternating user/assistant)
  type Message = { role: "user" | "assistant"; content: string };
  const conversationHistory: Message[] = (history ?? [])
    .filter(
      (
        row: { role: string | null; last_message: string | null }
      ) => row.last_message
    )
    .map((row: { role: string | null; last_message: string | null }) => ({
      role: row.role === "agent" ? ("assistant" as const) : ("user" as const),
      content: row.last_message as string,
    }));

  // Append the new incoming message
  conversationHistory.push({ role: "user", content: body });

  // 5. Call Claude
  let aiResponse = "";
  try {
    const anthropic = getAnthropicClient();
    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: systemPrompt,
      messages: conversationHistory,
    });
    const block = result.content[0];
    aiResponse = block.type === "text" ? block.text : "";
  } catch (err) {
    console.error("Claude error:", err);
    aiResponse =
      agent.language === "FR"
        ? "Désolé, je rencontre une difficulté technique. Veuillez réessayer dans un instant."
        : "Sorry, I'm experiencing a technical issue. Please try again shortly.";
  }

  // 6. Detect status from the user's message
  function detectStatus(msg: string): string | null {
    const lower = msg.toLowerCase();
    if (
      lower.includes("intéressé") ||
      lower.includes("interested") ||
      lower.includes("voudrais") ||
      lower.includes("j'aimerais") ||
      lower.includes("i'd like") ||
      lower.includes("tell me more")
    ) {
      return "qualifying";
    }
    if (
      (lower.includes("oui") || lower.includes("yes")) &&
      (lower.includes("$") ||
        lower.includes("prix") ||
        lower.includes("coût") ||
        lower.includes("price") ||
        lower.includes("cost"))
    ) {
      return "in_progress";
    }
    return null;
  }

  const newStatus = detectStatus(body) ?? "new";

  // 7. Save user message
  await supabase.from("conversations").insert({
    agent_id: agent.id,
    contact_phone: from,
    last_message: body,
    role: "user",
    status: newStatus,
  });

  // 8. Save AI response
  await supabase.from("conversations").insert({
    agent_id: agent.id,
    contact_phone: from,
    last_message: aiResponse,
    role: "agent",
    status: newStatus,
  });

  // 9. Send reply via agent's OWN Twilio credentials
  if (agent.twilio_account_sid && agent.twilio_auth_token) {
    try {
      const client = twilio(agent.twilio_account_sid, agent.twilio_auth_token);
      await client.messages.create({
        body: aiResponse,
        from: to,
        to: from,
      });
    } catch (err) {
      console.error("Twilio send error:", err);
    }
  }

  // Return empty TwiML so Twilio doesn't send a duplicate message
  return new Response("<Response/>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
