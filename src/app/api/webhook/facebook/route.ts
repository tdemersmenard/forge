import { createAdminClient } from "@/lib/supabase/admin";
import twilio from "twilio";

// ─── GET — Facebook webhook verification ─────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response("Verification failed", { status: 403 });
  }

  // Look up agent by their unique verify token
  const supabase = createAdminClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("id")
    .eq("facebook_verify_token", token)
    .limit(1);

  if (!agents || agents.length === 0) {
    return new Response("Verification failed", { status: 403 });
  }

  return new Response(challenge, { status: 200 });
}

// ─── POST — Incoming Facebook Lead Ads event ─────────────────────────────────
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const data = payload as {
    object?: string;
    entry?: Array<{
      id?: string;
      changes?: Array<{
        field?: string;
        value?: { leadgen_id?: string };
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
          "id, business_name, sector, language, phone, twilio_account_sid, twilio_auth_token, facebook_access_token"
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
        sector: string;
        language: string;
        phone: string | null;
        twilio_account_sid: string | null;
        twilio_auth_token: string | null;
        facebook_access_token: string | null;
      };

      // 2. Fetch lead data from Facebook Graph API using per-agent access token
      const fbToken = agent.facebook_access_token;
      if (!fbToken) {
        console.error("Agent has no facebook_access_token:", agent.id);
        continue;
      }

      let firstName = "";
      let lastName = "";
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
              lastName = val;
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

      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      if (!phone) {
        console.warn("Lead has no phone number, skipping SMS");
        continue;
      }

      // 3. Build opening message (includes sector per spec)
      const openingMessage =
        agent.language === "FR"
          ? `Bonjour${firstName ? ` ${firstName}` : ""}! Je suis l'assistant de ${agent.business_name}. Vous avez manifesté de l'intérêt pour nos services de ${agent.sector}. Comment puis-je vous aider? 😊`
          : `Hi${firstName ? ` ${firstName}` : ""}! I'm the assistant for ${agent.business_name}. You expressed interest in our ${agent.sector} services. How can I help? 😊`;

      // 4. Save lead row to conversations with source = 'facebook'
      await supabase.from("conversations").insert({
        agent_id: agent.id,
        contact_name: fullName || null,
        contact_phone: phone,
        contact_email: email || null,
        last_message: "Lead received from Facebook Ads",
        role: "user",
        status: "new",
        source: "facebook",
      });

      // 5. Save agent opening message
      await supabase.from("conversations").insert({
        agent_id: agent.id,
        contact_name: fullName || null,
        contact_phone: phone,
        contact_email: email || null,
        last_message: openingMessage,
        role: "agent",
        status: "new",
        source: "facebook",
      });

      // 6. Send initial outbound SMS
      if (agent.twilio_account_sid && agent.twilio_auth_token && agent.phone) {
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

      // 7. Send new-lead notification email (if agent has prefs)
      try {
        const { data: agentFull } = await supabase
          .from("agents")
          .select("user_id, notifications_prefs")
          .eq("id", agent.id)
          .single();

        const prefs = agentFull?.notifications_prefs as
          | { new_lead?: boolean }
          | null;
        if (prefs?.new_lead !== false && agentFull?.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(
            agentFull.user_id
          );
          const email = authUser?.user?.email;
          if (email) {
            const { sendNewLeadEmail } = await import("@/lib/notifications");
            await sendNewLeadEmail({
              to: email,
              businessName: agent.business_name,
              contactName: fullName || null,
              contactPhone: phone,
              source: "facebook",
            });
          }
        }
      } catch (err) {
        console.error("Notification email error:", err);
      }
    }
  }

  return new Response("OK", { status: 200 });
}
