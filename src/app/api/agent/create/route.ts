import { createClient } from "@/lib/supabase/server";
import { originGuard } from "@/lib/security";
import { AgentCreateSchema } from "@/lib/schemas/agent";

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

  // Check if user already has an agent (one-per-user invariant)
  const { data: existing } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return Response.json({ error: "Agent already exists" }, { status: 409 });
  }

  // Insert — user_id comes from session, NEVER from client
  const { error } = await supabase
    .from("agents")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) {
    console.error("[agent/create] db error:", error.message);
    return Response.json({ error: "Create failed" }, { status: 500 });
  }

  return Response.json({ success: true });
}
