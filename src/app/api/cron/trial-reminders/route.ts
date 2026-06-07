import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendTrialReminderEmail } from "@/lib/notifications";
import { PLANS } from "@/lib/plans";

// Vercel cron — runs daily at 14:00 UTC
// Secured by CRON_SECRET env var

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const stripe = getStripe();

  // Fetch all trialing agents with a Stripe subscription
  const { data: agents, error } = await supabase
    .from("agents")
    .select("id, user_id, agent_name, business_name, plan, stripe_subscription_id")
    .eq("plan_status", "trialing")
    .not("stripe_subscription_id", "is", null);

  if (error) {
    console.error("[trial-reminders] Supabase error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const results: { agentId: string; action: string; daysRemaining: number }[] = [];

  for (const agent of agents ?? []) {
    try {
      const sub = await stripe.subscriptions.retrieve(agent.stripe_subscription_id!);
      if (!sub.trial_end) continue;

      const daysRemaining = Math.ceil((sub.trial_end * 1000 - Date.now()) / 86_400_000);
      if (daysRemaining !== 7 && daysRemaining !== 3 && daysRemaining !== 1) continue;

      // Fetch user email
      const { data: userData } = await supabase.auth.admin.getUserById(agent.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const firstName = email.split("@")[0] ?? "there";
      const agentName = agent.agent_name ?? "your agent";
      const trialEndDate = new Date(sub.trial_end * 1000).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const planData = PLANS.find((p) => p.id === agent.plan) ?? PLANS[0];

      await sendTrialReminderEmail({
        to: email,
        firstName,
        agentName,
        daysRemaining,
        trialEndDate,
        planName: planData.name,
        planPrice: planData.price,
      });

      results.push({ agentId: agent.id, action: `sent_${daysRemaining}day_reminder`, daysRemaining });
    } catch (err) {
      console.error(`[trial-reminders] Error processing agent ${agent.id}:`, err);
    }
  }

  return Response.json({ sent: results.length, results });
}
