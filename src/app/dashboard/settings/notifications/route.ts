import { createClient } from "@/lib/supabase/server";
import { sendNewLeadEmail, sendDealClosedEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let body: {
    type: "new_lead" | "deal_closed";
    agentName?: string;
    contactName?: string | null;
    contactPhone?: string | null;
    source?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const to = user.email;
  if (!to) return new Response("No email on account", { status: 400 });

  if (body.type === "new_lead") {
    await sendNewLeadEmail({
      to,
      businessName: body.agentName ?? "your business",
      contactName: body.contactName ?? null,
      contactPhone: body.contactPhone ?? null,
      source: body.source,
    });
  } else if (body.type === "deal_closed") {
    await sendDealClosedEmail({
      to,
      businessName: body.agentName ?? "your business",
      contactName: body.contactName ?? null,
      contactPhone: body.contactPhone ?? null,
    });
  }

  return Response.json({ ok: true });
}
