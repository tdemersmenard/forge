import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { PlanId } from "@/lib/plans";
import { CheckoutSchema } from "@/lib/schemas/agent";
import { originGuard } from "@/lib/security";
import { getAppUrl } from "@/lib/env";
import { getPostHogClient } from "@/lib/posthog-server";

const PRICE_IDS: Record<PlanId, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  agency: process.env.STRIPE_PRICE_AGENCY,
};


export async function POST(request: Request) {
  const originBlock = originGuard(request);
  if (originBlock) return originBlock;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  let plan: PlanId;
  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }
    plan = parsed.data.plan;
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
    subscription_data: {
      trial_period_days: 14,
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
    },
    billing_address_collection: "auto",
    consent_collection: { terms_of_service: "none" },
    custom_text: {
      submit: { message: "No charge for 14 days. Cancel anytime." },
    },
    after_expiration: {
      recovery: { enabled: true, allow_promotion_codes: true },
    },
    success_url: `${getAppUrl()}/dashboard?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/onboarding/plan`,
    allow_promotion_codes: true,
    // user_id in both metadata and client_reference_id for webhook reliability
    client_reference_id: user.id,
    metadata: { user_id: user.id, plan },
  };

  if (agentRow?.stripe_customer_id) {
    sessionParams.customer = agentRow.stripe_customer_id;
  } else {
    sessionParams.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  getPostHogClient().capture({
    distinctId: user.id,
    event: "checkout_session_created",
    properties: { plan, email: user.email },
  });

  return Response.json({ url: session.url });
}
