import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
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
  searchParams: Promise<{ success?: string; checkout_success?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnTo=/dashboard");

  const params = await searchParams;
  const showSuccess = params.success === "true";
  const checkoutSuccess = params.checkout_success === "true";

  const { data: agents } = await supabase
    .from("agents")
    .select("id, plan, plan_status, stripe_subscription_id");

  type AgentRow = { id: string; plan?: string; plan_status?: string; stripe_subscription_id?: string | null };
  const agentIds = (agents ?? []).map((a: AgentRow) => a.id);
  const firstAgent = (agents ?? [])[0] as AgentRow | undefined;
  const agentPlan = firstAgent?.plan ?? null;
  const agentPlanStatus = firstAgent?.plan_status ?? null;

  // Trial banner: only fetch from Stripe if trialing + subscription exists
  let trialDaysRemaining: number | null = null;
  if (
    firstAgent?.plan_status === "trialing" &&
    firstAgent?.stripe_subscription_id
  ) {
    try {
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(
        firstAgent.stripe_subscription_id
      );
      if (sub.trial_end) {
        const days = Math.ceil(
          (sub.trial_end * 1000 - Date.now()) / 86_400_000
        );
        // Only show banner when 3 days or fewer remain
        if (days >= 0 && days <= 3) {
          trialDaysRemaining = days;
        }
      }
    } catch {
      // Non-critical — skip the banner if Stripe is unreachable
    }
  }

  let initialConversations: ConvRow[] = [];
  if (agentIds.length > 0) {
    const { data } = await supabase
      .from("conversations")
      .select("id, agent_id, contact_name, contact_phone, contact_email, last_message, role, status, revenue, source, created_at")
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
        checkoutSuccess={checkoutSuccess}
        plan={agentPlan}
        planStatus={agentPlanStatus}
        trialDaysRemaining={trialDaysRemaining}
      />
      <RealtimeOverview
        agentIds={agentIds}
        initialConversations={initialConversations}
      />
    </main>
  );
}
