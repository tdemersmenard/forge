import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/claude";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let message: string;
  try {
    const body = await request.json();
    message = body.message;
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!message?.trim()) return new Response("Missing message", { status: 400 });

  const { data: agents } = await supabase
    .from("agents")
    .select("business_name, sector, services, tone, language")
    .limit(1);

  if (!agents || agents.length === 0) {
    return Response.json({ reply: "No agent configured." });
  }

  const agent = agents[0] as {
    business_name: string;
    sector: string;
    services: string;
    tone: string;
    language: string;
  };

  const systemPrompt = `Tu es l'assistant virtuel de ${agent.business_name}, une entreprise de ${agent.sector}.
Ton rôle est de qualifier les leads, répondre aux questions et aider à closer des clients.
Services offerts: ${agent.services}.
Ton ton: ${agent.tone}. Langue principale: ${agent.language}.
Tu communiques par SMS — sois concis, max 2-3 phrases par message.
Ne mentionne jamais que tu es une IA sauf si on te le demande directement.`;

  try {
    const anthropic = getAnthropicClient();
    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });
    const block = result.content[0];
    const reply = block.type === "text" ? block.text : "";
    return Response.json({ reply });
  } catch (err) {
    console.error("Claude test error:", err);
    return Response.json(
      { reply: "Error calling Claude. Check your API key." },
      { status: 500 }
    );
  }
}
