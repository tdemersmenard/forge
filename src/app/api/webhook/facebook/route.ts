import { createAdminClient } from "@/lib/supabase/admin";
import twilio from "twilio";

// ─── GET — Facebook webhook verification ─────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.FACEBOOK_VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Verification failed", { status: 403 });
}

// ─── POST — Incoming Facebook Lead Ads event ─────────────────────────────────
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Safely traverse the FB payload structure
  const data = payload as {
    object?: string;
    entry?: Array<{
      id?: string;
      changes?: Array<{
        field?: string;
        value?: {
          leadgen_id?: string;
          page_id?: string;
        };
      }>;
    }>;
  };

  if (data.object !== "page") {
    return new Response("OK", { status: 200 });
  }

  const supabase = createAdminClient();

  for (const entry of data.entry ?? []) {
    const pageId = entry.id;

    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;

      const leadgenId = change.value?.leadgen_id;
      if (!leadgenId) continue;

      // 1. Find agent by facebook_page_id
      const { data: agents } = await supabase
        .from("agents")
        .select(
          "id, business_name, language, phone, twilio_account_sid, twilio_auth_token"
        )
        .eq("facebook_page_id", pageId)
        .limit(1);

      if (!agents || agents.length === 0) {
        console.warn("No agent found for page_id:", pageId);
        continue;
      }

      const agent = agents[0] as {
        id: string;
        business_name: string;
        language: string;
        phone: string | null;
        twilio_account_sid: string | null;
        twilio_auth_token: string | null;
      };

      // 2. Fetch lead data from Facebook Graph API
      const fbToken = process.env.FACEBOOK_ACCESS_TOKEN;
      if (!fbToken) {
        console.error("Missing FACEBOOK_ACCESS_TOKEN");
        continue;
      }

      let firstName = "";
      let phone = "";
      let email = "";

      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${fbToken}`
        );
        const leadData = (await res.json()) as {
          field_data?: Array<{ name: string; values: string[] }>;
        };

        for (const field of leadData.field_data ?? []) {
          const val = field.values[0] ?? "";
          switch (field.name) {
            case "first_name":
              firstName = val;
              break;
            case "last_name":
              firstName = firstName ? `${firstName} ${val}` : val;
              break;
            case "phone_number":
              phone = val;
              break;
            case "email":
              email = val;
              break;
          }
        }
      } catch (err) {
        console.error("Failed to fetch FB lead data:", err);
        continue;
      }

      if (!phone) {
        console.warn("Lead has no phone number, skipping SMS");
        continue;
      }

      // 3. Build opening message
      const openingMessage =
        agent.language === "FR"
          ? `Bonjour${firstName ? ` ${firstName}` : ""}! Je suis l'assistant de ${agent.business_name}. Vous avez manifesté de l'intérêt pour nos services — comment puis-je vous aider?`
          : `Hi${firstName ? ` ${firstName}` : ""}! I'm the assistant for ${agent.business_name}. You expressed interest in our services — how can I help you?`;

      // 4. Create conversation row in Supabase
      await supabase.from("conversations").insert({
        agent_id: agent.id,
        contact_name: firstName || null,
        contact_phone: phone,
        contact_email: email || null,
        last_message: openingMessage,
        role: "agent",
        status: "new",
      });

      // 5. Send initial outbound SMS using agent's Twilio credentials
      if (
        agent.twilio_account_sid &&
        agent.twilio_auth_token &&
        agent.phone
      ) {
        try {
          const client = twilio(
            agent.twilio_account_sid,
            agent.twilio_auth_token
          );
          await client.messages.create({
            body: openingMessage,
            from: agent.phone,
            to: phone,
          });
        } catch (err) {
          console.error("Twilio outbound SMS error:", err);
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}
