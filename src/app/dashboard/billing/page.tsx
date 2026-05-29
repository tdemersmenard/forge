import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { BillingClient } from "./BillingClient";

type Invoice = {
  id: string;
  amount_paid: number;
  status: string | null;
  created: number;
  invoice_pdf: string | null;
};

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Subscription — read from agents table
  let subscription: {
    plan: string;
    plan_status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  } | null = null;

  const { data: agentData } = await supabase
    .from("agents")
    .select("plan, plan_status, stripe_customer_id, stripe_subscription_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (agentData?.plan_status) {
    subscription = agentData;
  }

  // Conversations this month (unique contacts)
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const { data: agents } = await supabase.from("agents").select("id");
  const agentIds = (agents ?? []).map((a: { id: string }) => a.id);

  let conversationsThisMonth = 0;
  if (agentIds.length > 0) {
    const { data: convData } = await supabase
      .from("conversations")
      .select("contact_phone")
      .in("agent_id", agentIds)
      .gte("created_at", startOfMonth);

    conversationsThisMonth = new Set(
      (convData ?? [])
        .map((c: { contact_phone: string | null }) => c.contact_phone)
        .filter(Boolean)
    ).size;
  }

  // Stripe invoices
  let invoices: Invoice[] = [];
  if (agentData?.stripe_customer_id) {
    try {
      const stripe = getStripe();
      const list = await stripe.invoices.list({
        customer: agentData.stripe_customer_id,
        limit: 10,
      });
      invoices = list.data.map((inv) => ({
        id: inv.id ?? "",
        amount_paid: inv.amount_paid,
        status: inv.status ?? null,
        created: inv.created,
        invoice_pdf: inv.invoice_pdf ?? null,
      }));
    } catch (err) {
      console.error("Failed to fetch Stripe invoices:", err);
    }
  }

  // Trial days remaining — computed from account creation + 7 days
  let trialDaysRemaining: number | null = null;
  if (!subscription || subscription.plan_status === "trialing") {
    const end = new Date(user.created_at);
    end.setDate(end.getDate() + 7);
    trialDaysRemaining = Math.max(
      0,
      Math.ceil((end.getTime() - Date.now()) / 86400000)
    );
  }

  return (
    <main className="flex-1 overflow-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Billing</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your plan and subscription.
        </p>
      </div>
      <BillingClient
        subscription={subscription}
        conversationsThisMonth={conversationsThisMonth}
        trialDaysRemaining={trialDaysRemaining}
        invoices={invoices}
      />
    </main>
  );
}
