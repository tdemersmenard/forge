import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-zeta-silk.vercel.app";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!sub?.stripe_customer_id) {
    return Response.json(
      { error: "No billing account found. Please subscribe to a plan first." },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${APP_URL}/dashboard/billing`,
  });

  return Response.json({ url: session.url });
}
