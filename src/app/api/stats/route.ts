import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60; // cache 60s

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("agents")
      .select("id", { count: "exact", head: true });

    return Response.json({ count: count ?? 0 });
  } catch {
    return Response.json({ count: 0 });
  }
}
