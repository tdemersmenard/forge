import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import twilio from "twilio";

// ─── GET — Facebook webhook verification ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST — Incoming lead event ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Read raw body for signature verification
  const rawBody = await req.text();

  // 2. Verify X-Hub-Signature-256
  const signature = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (appSecret) {
    if (!signature) {
      return new NextResponse("Missing signature", { status: 403 });
    }
    const expected = `sha256=${crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex")}`;
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);
    if (
      sigBuffer.length !== expBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expBuffer)
    ) {
      return new NextResponse("Invalid signature", { status: 403 });
    }
  }

  // 3. Parse payload
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const data = payload as {
    object?: string;
    entry?: Array<{
      id?: string;
      changes?: Array<{
        field?: string;
        value?: { leadgen_id?: string; page_id?: string };
      }>;
    }>;
  };

  if (data.object !== "page") {
    return new NextResponse("OK", { status: 200 });
  }

  const supabase = createAdminClient();

  for (const entry of data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;

      const leadgenId = change.value?.leadgen_id;
      const pageId = change.value?.page_id ?? entry.id;
      if (!leadgenId || !pageId) continue;

      // 4. Find agent by facebook_page_id
      const { data: agents } = await supabase
        .from("agents")
        .select(
          "id, business_name, language, phone, twilio_account_sid, twilio_auth_token, facebook_access_token"
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
        facebook_access_token: string | null;
      };

      if (!agent.facebook_access_token) {
        console.error("Agent missing facebook_access_token:", agent.id);
        continue;
      }

      // 5. Fetch lead details from Graph API
      let firstName = "";
      let lastName = "";
      let phone = "";
      let email = "";

      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${agent.facebook_access_token}`
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
        console.error("Failed to fetch lead from Graph API:", err);
        continue;
      }

      const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;

      // 6. Insert lead row (user side)
      await supabase.from("conversations").insert({
        agent_id: agent.id,
        contact_name: fullName,
        contact_phone: phone || null,
        contact_email: email || null,
        last_message: "Lead received from Facebook Ads",
        role: "user",
        status: "new",
        source: "facebook",
      });

      // 7. Build opening message
      const greeting = firstName ? ` ${firstName}` : "";
      const openingMessage =
        agent.language === "FR"
          ? `Bonjour${greeting}! Je suis l'assistant de ${agent.business_name}. Vous avez manifesté de l'intérêt pour nos services — comment puis-je vous aider?`
          : `Hi${greeting}! I'm the assistant for ${agent.business_name}. You expressed interest in our services — how can I help you?`;

      // 8. Save agent opening message
      await supabase.from("conversations").insert({
        agent_id: agent.id,
        contact_name: fullName,
        contact_phone: phone || null,
        contact_email: email || null,
        last_message: openingMessage,
        role: "agent",
        status: "new",
        source: "facebook",
      });

      // 9. Send SMS via agent's Twilio credentials
      if (phone && agent.twilio_account_sid && agent.twilio_auth_token && agent.phone) {
        try {
          const client = twilio(agent.twilio_account_sid, agent.twilio_auth_token);
          await client.messages.create({
            body: openingMessage,
            from: agent.phone,
            to: phone,
          });
        } catch (err) {
          console.error("Twilio SMS error:", err);
        }
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
