import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { originGuard } from "@/lib/security";
import { getAppUrl } from "@/lib/env";

export async function POST(request: Request) {
  const originBlock = originGuard(request);
  if (originBlock) return originBlock;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: sub } = await supabase
    .from("agents")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
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
    return_url: `${getAppUrl()}/dashboard/billing`,
  });

  return Response.json({ url: session.url });
}
