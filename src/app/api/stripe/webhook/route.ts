import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
import Stripe from "stripe";
import { getPostHogClient } from "@/lib/posthog-server";

async function trackMetaPurchase(plan: string) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_PIXEL_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const planData = PLANS.find((p) => p.id === plan);
  const value = planData?.price ?? 0;

  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              custom_data: { currency: "USD", value },
            },
          ],
        }),
      }
    );
  } catch (err) {
    console.error("[webhook] Meta Conversions API error:", err);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) return new Response("Missing signature", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("[webhook] event:", event.type);

  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // user_id from metadata (primary) or client_reference_id (fallback)
      const userId =
        session.metadata?.user_id ?? session.client_reference_id ?? null;

      // Validate plan from metadata against whitelist
      const planFromMetadata = session.metadata?.plan;
      const validPlanIds = PLANS.map((p) => p.id);
      if (!planFromMetadata || !validPlanIds.includes(planFromMetadata as typeof PLANS[number]["id"])) {
        console.error("[webhook] invalid plan in session metadata:", planFromMetadata);
        return new Response("Invalid plan", { status: 400 });
      }
      const plan = planFromMetadata;

      // Cross-check the actual priceId used vs expected for this plan
      try {
        const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const actualPriceId = items.data[0]?.price?.id;
        const expectedPriceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
        if (!actualPriceId || actualPriceId !== expectedPriceId) {
          console.error("[webhook] price mismatch", { plan, actualPriceId, expectedPriceId });
          return new Response("Price mismatch", { status: 400 });
        }
      } catch (err) {
        console.error("[webhook] failed to verify line items:", err);
        return new Response("Verification failed", { status: 500 });
      }

      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (!userId) {
        console.error("[webhook] no userId — cannot update agent. Check client_reference_id and metadata in checkout session.");
        break;
      }
      if (!customerId) {
        console.error("[webhook] no customerId");
        break;
      }
      if (!subscriptionId) {
        console.error("[webhook] no subscriptionId");
        break;
      }

      // Default to 'trialing' — all new checkouts include a trial period
      let planStatus = "trialing";
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        planStatus = sub.status;
      } catch (err) {
        console.error("[webhook] failed to retrieve subscription:", err);
      }

      const { error: updateError } = await supabaseAdmin
        .from("agents")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          plan_status: planStatus,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[webhook] supabase update error:", updateError);
      } else {
        await trackMetaPurchase(plan);
        const planData = PLANS.find((p) => p.id === plan);
        getPostHogClient().capture({
          distinctId: userId,
          event: "subscription_activated",
          properties: { plan, plan_status: planStatus, revenue: planData?.price ?? 0 },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const { error } = await supabaseAdmin
        .from("agents")
        .update({ plan_status: sub.status })
        .eq("stripe_subscription_id", sub.id);
      if (error) console.error("[webhook] update error:", error);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const { error } = await supabaseAdmin
        .from("agents")
        .update({ plan_status: "canceled" })
        .eq("stripe_subscription_id", sub.id);
      if (!error) {
        const { data: agentRow } = await supabaseAdmin
          .from("agents")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .single();
        if (agentRow?.user_id) {
          getPostHogClient().capture({
            distinctId: agentRow.user_id as string,
            event: "subscription_canceled",
          });
        }
      } else {
        console.error("[webhook] update error:", error);
      }
      break;
    }

    default:
  }

  return new Response("OK", { status: 200 });
}
