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

  // Subscription
  let subscription: {
    plan: string;
    status: string;
    trial_end: string | null;
    stripe_customer_id: string | null;
  } | null = null;

  try {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, trial_end, stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    subscription = data;
  } catch {
    // Table may not exist yet — treat as free trial
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
  if (subscription?.stripe_customer_id) {
    try {
      const stripe = getStripe();
      const list = await stripe.invoices.list({
        customer: subscription.stripe_customer_id,
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

  // Trial days remaining
  let trialDaysRemaining: number | null = null;
  if (subscription?.status === "trialing" && subscription.trial_end) {
    const end = new Date(subscription.trial_end);
    trialDaysRemaining = Math.max(
      0,
      Math.ceil((end.getTime() - Date.now()) / 86400000)
    );
  } else if (!subscription) {
    // No subscription yet — trial starts from account creation
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
