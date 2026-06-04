import { createClient } from "@/lib/supabase/server";
import { originGuard } from "@/lib/security";
import { AgentCreateSchema } from "@/lib/schemas/agent";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(request: Request) {
  const originBlock = originGuard(request);
  if (originBlock) return originBlock;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AgentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }

  // Enforce plan-based agent limit
  const { data: existing } = await supabase
    .from("agents")
    .select("id, plan")
    .eq("user_id", user.id);

  const count = existing?.length ?? 0;
  const userPlan = (existing ?? [])[0]?.plan ?? null;
  const limit = userPlan === "agency" ? null : userPlan === "growth" ? 3 : 1;

  if (limit !== null && count >= limit) {
    return Response.json(
      { error: `Your plan allows up to ${limit} agent${limit === 1 ? "" : "s"}. Upgrade to add more.` },
      { status: 403 }
    );
  }

  // Insert — user_id comes from session, NEVER from client
  const { error } = await supabase
    .from("agents")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) {
    console.error("[agent/create] db error:", error.message);
    return Response.json({ error: "Create failed" }, { status: 500 });
  }

  getPostHogClient().capture({
    distinctId: user.id,
    event: "agent_created",
    properties: { plan: userPlan, sector: parsed.data.sector },
  });

  return Response.json({ success: true });
}
