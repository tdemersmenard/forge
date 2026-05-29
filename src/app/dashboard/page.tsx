import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RealtimeOverview } from "./RealtimeOverview";

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
      {showSuccess && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4">
          <span className="mt-0.5 text-lg leading-none">🎉</span>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              Your agent is now active!
            </p>
            <p className="mt-0.5 text-xs text-emerald-400/70">
              Connect your Twilio number in Settings → Integrations to start
              receiving leads.
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Overview</h1>
        <p className="mt-1 text-sm text-white/40">
          Welcome back,{" "}
          <span className="text-white/70">{user.email}</span>
        </p>
      </div>

      <RealtimeOverview
        agentIds={agentIds}
        initialConversations={initialConversations}
      />
    </main>
  );
}
