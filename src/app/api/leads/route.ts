import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  let body: {
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
    note?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!body.firstName || !body.phone) {
    return Response.json({ error: "firstName and phone are required" }, { status: 400 });
  }

  // Get agent for this user
  const { data: agentRow } = await supabase
    .from("agents")
    .select("id, agent_name, business_name, twilio_account_sid, twilio_auth_token, twilio_phone_number")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!agentRow) {
    return Response.json({ error: "No agent found" }, { status: 404 });
  }

  const contactName = [body.firstName, body.lastName].filter(Boolean).join(" ");
  const supabaseAdmin = createAdminClient();

  // Insert conversation row
  const { data: conv, error: insertError } = await supabaseAdmin
    .from("conversations")
    .insert({
      agent_id: agentRow.id,
      contact_name: contactName,
      contact_phone: body.phone,
      contact_email: body.email ?? null,
      status: "new",
      source: "manual",
      last_message: body.note || "Lead added manually",
      role: "user",
    })
    .select()
    .single();

  if (insertError) {
    console.error("[leads] insert error:", insertError);
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  // Send Twilio SMS if credentials are configured
  if (
    agentRow.twilio_account_sid &&
    agentRow.twilio_auth_token &&
    agentRow.twilio_phone_number
  ) {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(agentRow.twilio_account_sid, agentRow.twilio_auth_token);

      const agentName = agentRow.agent_name || "Your agent";
      const businessName = agentRow.business_name || "";
      const greeting = businessName
        ? `Bonjour ${body.firstName}! Je suis ${agentName} de ${businessName}. Comment puis-je vous aider?`
        : `Bonjour ${body.firstName}! Je suis ${agentName}. Comment puis-je vous aider?`;

      await client.messages.create({
        body: greeting,
        from: agentRow.twilio_phone_number,
        to: body.phone,
      });

      // Save the outbound SMS as a conversation row
      await supabaseAdmin.from("conversations").insert({
        agent_id: agentRow.id,
        contact_name: contactName,
        contact_phone: body.phone,
        contact_email: body.email ?? null,
        status: "new",
        source: "manual",
        last_message: greeting,
        role: "agent",
      });
    } catch (err) {
      // SMS failed — don't fail the whole request, lead was already created
      console.error("[leads] twilio sms error:", err);
    }
  }

  return Response.json({ success: true, conversation: conv });
}
