import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { PlanId } from "@/lib/plans";

const PRICE_IDS: Record<PlanId, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-zeta-silk.vercel.app";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  let plan: PlanId;
  try {
    const body = await request.json();
    plan = body.plan as PlanId;
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return Response.json(
      { error: `Price ID for plan "${plan}" is not configured. Set STRIPE_PRICE_${plan.toUpperCase()} in your environment variables.` },
      { status: 500 }
    );
  }

  // Check for existing Stripe customer
  const { data: agentRow } = await supabase
    .from("agents")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const stripe = getStripe();

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${APP_URL}/onboarding?checkout=success`,
    cancel_url: `${APP_URL}/onboarding/plan`,
    allow_promotion_codes: true,
    metadata: { user_id: user.id, plan },
  };

  if (agentRow?.stripe_customer_id) {
    sessionParams.customer = agentRow.stripe_customer_id;
  } else {
    sessionParams.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return Response.json({ url: session.url });
}
