import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export type AgentRow = {
  id: string;
  agent_name: string | null;
  business_name: string;
  sector: string;
  services: string;
  services_list: { name: string; price: string; unit: string }[] | null;
  contract_value: string | null;
  tone: string;
  language: string;
  bilingual: boolean | null;
  business_hours: { openTime: string; closeTime: string; days: string[] } | null;
  qualification_questions: string[] | null;
  disqualification_criteria: string | null;
  service_area: string | null;
  promotions: string | null;
  never_say: string | null;
  escalation_criteria: string | null;
  phone: string | null;
  twilio_account_sid: string | null;
  facebook_page_id: string | null;
  notifications_prefs: { new_lead: boolean; deal_closed: boolean } | null;
  // Secret tokens are never sent to the browser — only boolean flags
  _twilioConfigured: boolean;
  _facebookConfigured: boolean;
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: agentData } = await supabase
    .from("agents")
    .select(`
      id, user_id, agent_name, business_name, sector, services, services_list,
      contract_value, qualification_questions, disqualification_criteria,
      tone, language, bilingual, business_hours,
      service_area, promotions, never_say, escalation_criteria,
      phone, twilio_account_sid, facebook_page_id, notifications_prefs
    `)
    .limit(1)
    .maybeSingle();

  // Fetch secret presence as booleans only — tokens never leave the server
  let twilioConfigured = false;
  let facebookConfigured = false;
  if (agentData?.id) {
    const { data: secretsFlags } = await supabase
      .from("agents")
      .select("twilio_auth_token, facebook_access_token, facebook_verify_token")
      .eq("id", agentData.id)
      .maybeSingle();
    twilioConfigured = !!secretsFlags?.twilio_auth_token;
    facebookConfigured = !!(secretsFlags?.facebook_access_token || secretsFlags?.facebook_verify_token);
  }

  const agent = agentData
    ? { ...agentData, _twilioConfigured: twilioConfigured, _facebookConfigured: facebookConfigured } as AgentRow
    : null;

  return (
    <main className="flex-1 overflow-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your agent configuration and integrations.
        </p>
      </div>
      <SettingsClient agent={agent} userEmail={user.email ?? ""} />
    </main>
  );
}
