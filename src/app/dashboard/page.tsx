import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RealtimeOverview } from "./RealtimeOverview";
import { DashboardOverviewHeader } from "./DashboardOverviewHeader";

export type ConvRow = {
  id: string;
  agent_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  last_message: string | null;
  role: string | null;
  status: string | null;
  revenue: number | null;
  source: string | null;
  created_at: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const showSuccess = params.success === "true";

  const { data: agents } = await supabase.from("agents").select("id");
  const agentIds = (agents ?? []).map((a: { id: string }) => a.id);

  let initialConversations: ConvRow[] = [];
  if (agentIds.length > 0) {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .in("agent_id", agentIds)
      .order("created_at", { ascending: false })
      .limit(500);
    initialConversations = (data as ConvRow[]) ?? [];
  }

  return (
    <main className="flex-1 overflow-auto px-6 py-8">
      <DashboardOverviewHeader
        email={user.email ?? ""}
        showSuccess={showSuccess}
      />
      <RealtimeOverview
        agentIds={agentIds}
        initialConversations={initialConversations}
      />
    </main>
  );
}
