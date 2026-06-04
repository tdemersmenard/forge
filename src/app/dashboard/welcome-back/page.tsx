import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeBackClient } from "./WelcomeBackClient";

type ServiceItem = { name: string; price: string; unit: string };

export default async function WelcomeBackPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnTo=/dashboard/welcome-back");

  const { data: agent } = await supabase
    .from("agents")
    .select(
      "agent_name, business_name, sector, services_list, qualification_questions, tone, language"
    )
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!agent) redirect("/onboarding");

  const serviceCount = ((agent.services_list as ServiceItem[] | null) ?? []).filter(
    (s) => s.name?.trim()
  ).length;
  const questionCount = ((agent.qualification_questions as string[] | null) ?? []).filter(
    (q: string) => q?.trim()
  ).length;

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "";

  return (
    <WelcomeBackClient
      firstName={firstName}
      agentName={agent.agent_name ?? ""}
      businessName={agent.business_name ?? ""}
      sector={agent.sector ?? ""}
      serviceCount={serviceCount}
      questionCount={questionCount}
      tone={agent.tone ?? ""}
      language={agent.language ?? ""}
    />
  );
}
