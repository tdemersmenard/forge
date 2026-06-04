import { createAdminClient } from "@/lib/supabase/admin";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = ((body as { email?: unknown }).email ?? "").toString().trim().toLowerCase();

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    await supabase
      .from("email_captures")
      .upsert({ email, captured_at: new Date().toISOString() }, { onConflict: "email" });
  } catch {
    // Non-blocking — table may not exist yet, that's okay
  }

  getPostHogClient().capture({
    distinctId: email,
    event: "email_captured",
    properties: { $set: { email } },
  });

  return Response.json({ ok: true });
}
