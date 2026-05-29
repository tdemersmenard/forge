import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  console.log("[webhook] received event, signature present:", !!signature);

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

  console.log("[webhook] event type:", event.type, "id:", event.id);

  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[webhook] checkout.session.completed — session id:", session.id);
      console.log("[webhook] metadata:", JSON.stringify(session.metadata));
      console.log("[webhook] client_reference_id:", session.client_reference_id);

      // user_id from metadata (primary) or client_reference_id (fallback)
      const userId =
        session.metadata?.user_id ?? session.client_reference_id ?? null;
      const plan = session.metadata?.plan ?? "starter";
      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      console.log("[webhook] userId:", userId, "plan:", plan, "customerId:", customerId, "subscriptionId:", subscriptionId);

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

      let planStatus = "active";
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        planStatus = sub.status;
        console.log("[webhook] subscription status:", planStatus);
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
        console.log("[webhook] agent updated successfully for user:", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      console.log("[webhook] customer.subscription.updated — sub id:", sub.id, "status:", sub.status);
      const { error } = await supabaseAdmin
        .from("agents")
        .update({ plan_status: sub.status })
        .eq("stripe_subscription_id", sub.id);
      if (error) console.error("[webhook] update error:", error);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      console.log("[webhook] customer.subscription.deleted — sub id:", sub.id);
      const { error } = await supabaseAdmin
        .from("agents")
        .update({ plan_status: "canceled" })
        .eq("stripe_subscription_id", sub.id);
      if (error) console.error("[webhook] update error:", error);
      break;
    }

    default:
      console.log("[webhook] unhandled event type:", event.type);
  }

  return new Response("OK", { status: 200 });
}
