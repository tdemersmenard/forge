import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .limit(1);

  const agent = (agents?.[0] ?? null) as {
    id: string;
    business_name: string;
    sector: string;
    services: string;
    tone: string;
    language: string;
    phone: string | null;
    twilio_account_sid: string | null;
    twilio_auth_token: string | null;
    facebook_page_id: string | null;
    facebook_access_token: string | null;
    facebook_verify_token: string | null;
    notifications_prefs: { new_lead: boolean; deal_closed: boolean } | null;
  } | null;

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
