"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SECTORS = ["Piscines", "Pelouses", "Ménage", "HVAC", "Autre"];
const TONES = ["Professionnel", "Amical", "Direct"];

type Agent = {
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
};

type Tab = "agent" | "integrations" | "notifications";

interface Props {
  agent: Agent | null;
  userEmail: string;
}

function SaveButton({
  loading,
  saved,
  onClick,
  label = "Save changes",
}: {
  loading: boolean;
  saved: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Saving…" : saved ? "Saved ✓" : label}
    </button>
  );
}

function CopyButton({
  copied,
  onClick,
}: {
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-white/35">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-white" : "bg-white/[0.12]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#0a0a0a] transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsClient({ agent, userEmail }: Props) {
  const [tab, setTab] = useState<Tab>("agent");

  // ── Agent tab ──────────────────────────────────────────────────────────────
  const [agentForm, setAgentForm] = useState({
    business_name: agent?.business_name ?? "",
    sector: agent?.sector ?? "",
    services: agent?.services ?? "",
    tone: agent?.tone ?? "",
    language: agent?.language ?? "FR",
  });
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentSaved, setAgentSaved] = useState(false);

  // Test agent
  const [testMsg, setTestMsg] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testReply, setTestReply] = useState<string | null>(null);

  // ── Integrations tab ───────────────────────────────────────────────────────
  const [twilioForm, setTwilioForm] = useState({
    phone: agent?.phone ?? "",
    twilio_account_sid: agent?.twilio_account_sid ?? "",
    twilio_auth_token: agent?.twilio_auth_token ?? "",
  });
  const [twilioSaving, setTwilioSaving] = useState(false);
  const [twilioSaved, setTwilioSaved] = useState(false);

  const [fbForm, setFbForm] = useState({
    facebook_page_id: agent?.facebook_page_id ?? "",
    facebook_access_token: agent?.facebook_access_token ?? "",
    facebook_verify_token: agent?.facebook_verify_token ?? "",
  });
  const [fbSaving, setFbSaving] = useState(false);
  const [fbSaved, setFbSaved] = useState(false);
  const [vtCopied, setVtCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [showFbToken, setShowFbToken] = useState(false);

  const WEBHOOK_URL = "https://forge-zeta-silk.vercel.app/api/webhook/facebook";

  // ── Notifications tab ──────────────────────────────────────────────────────
  const defaultPrefs = agent?.notifications_prefs ?? {
    new_lead: true,
    deal_closed: true,
  };
  const [notifForm, setNotifForm] = useState({
    new_lead: defaultPrefs.new_lead ?? true,
    deal_closed: defaultPrefs.deal_closed ?? true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  const supabase = createClient();

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function markSaved(
    setSaving: (v: boolean) => void,
    setSaved: (v: boolean) => void
  ) {
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveAgent() {
    if (!agent) return;
    setAgentSaving(true);
    await supabase.from("agents").update(agentForm).eq("id", agent.id);
    await markSaved(setAgentSaving, setAgentSaved);
  }

  async function testAgent() {
    if (!testMsg.trim()) return;
    setTestLoading(true);
    setTestReply(null);
    try {
      const res = await fetch("/api/agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMsg }),
      });
      const data = (await res.json()) as { reply: string };
      setTestReply(data.reply);
    } catch {
      setTestReply("Error — could not reach the agent.");
    }
    setTestLoading(false);
  }

  async function saveTwilio() {
    if (!agent) return;
    setTwilioSaving(true);
    await supabase.from("agents").update(twilioForm).eq("id", agent.id);
    await markSaved(setTwilioSaving, setTwilioSaved);
  }

  async function saveFacebook() {
    if (!agent) return;
    setFbSaving(true);
    await supabase.from("agents").update(fbForm).eq("id", agent.id);
    await markSaved(setFbSaving, setFbSaved);
  }

  async function saveNotifications() {
    if (!agent) return;
    setNotifSaving(true);
    await supabase
      .from("agents")
      .update({ notifications_prefs: notifForm })
      .eq("id", agent.id);
    await markSaved(setNotifSaving, setNotifSaved);
  }

  async function copyVerifyToken() {
    if (!fbForm.facebook_verify_token) return;
    await navigator.clipboard.writeText(fbForm.facebook_verify_token);
    setVtCopied(true);
    setTimeout(() => setVtCopied(false), 2000);
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "agent", label: "Agent" },
    { key: "integrations", label: "Integrations" },
    { key: "notifications", label: "Notifications" },
  ];

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-2 text-sm font-medium text-white/50">No agent configured</p>
        <a
          href="/onboarding"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
        >
          Set up your agent
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-[#0a0a0a]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Agent tab ──────────────────────────────────────────────────────── */}
      {tab === "agent" && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-5 text-sm font-semibold text-white">Agent configuration</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Business name</label>
                <input
                  type="text"
                  value={agentForm.business_name}
                  onChange={(e) =>
                    setAgentForm((p) => ({ ...p, business_name: e.target.value }))
                  }
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Sector</label>
                <select
                  value={agentForm.sector}
                  onChange={(e) =>
                    setAgentForm((p) => ({ ...p, sector: e.target.value }))
                  }
                  className="h-10 rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-sm text-white outline-none focus:border-white/25 transition-colors"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Services</label>
                <textarea
                  value={agentForm.services}
                  onChange={(e) =>
                    setAgentForm((p) => ({ ...p, services: e.target.value }))
                  }
                  rows={4}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Tone</label>
                <div className="flex gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAgentForm((p) => ({ ...p, tone: t }))}
                      className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                        agentForm.tone === t
                          ? "border-white bg-white/[0.06] text-white"
                          : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Language</label>
                <div className="flex gap-2">
                  {["FR", "EN"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setAgentForm((p) => ({ ...p, language: lang }))}
                      className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                        agentForm.language === lang
                          ? "border-white bg-white/[0.06] text-white"
                          : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      {lang === "FR" ? "🇫🇷 Français" : "🇬🇧 English"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <SaveButton
                loading={agentSaving}
                saved={agentSaved}
                onClick={saveAgent}
              />
            </div>
          </div>

          {/* Test your agent */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-1 text-sm font-semibold text-white">Test your agent</h2>
            <p className="mb-4 text-xs text-white/40">
              Simulate an incoming SMS to see how your agent would respond.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && testAgent()}
                placeholder="Hi, I'm interested in your services…"
                className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
              />
              <button
                type="button"
                disabled={testLoading || !testMsg.trim()}
                onClick={testAgent}
                className="h-10 rounded-md bg-white px-4 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {testLoading ? "…" : "Send"}
              </button>
            </div>
            {testReply !== null && (
              <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Agent response
                </p>
                <p className="text-sm text-white/80 leading-relaxed">{testReply}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Integrations tab ───────────────────────────────────────────────── */}
      {tab === "integrations" && (
        <div className="flex flex-col gap-6">
          {/* Twilio */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="mb-5 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Twilio</h2>
              {twilioForm.phone && (
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  Connected
                </span>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Phone number</label>
                <input
                  type="tel"
                  value={twilioForm.phone}
                  onChange={(e) =>
                    setTwilioForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+15551234567"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Account SID</label>
                <input
                  type="text"
                  value={twilioForm.twilio_account_sid}
                  onChange={(e) =>
                    setTwilioForm((p) => ({ ...p, twilio_account_sid: e.target.value }))
                  }
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Auth Token</label>
                <input
                  type="password"
                  value={twilioForm.twilio_auth_token}
                  onChange={(e) =>
                    setTwilioForm((p) => ({ ...p, twilio_auth_token: e.target.value }))
                  }
                  placeholder="Your Twilio Auth Token"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton
                loading={twilioSaving}
                saved={twilioSaved}
                onClick={saveTwilio}
                label="Save Twilio"
              />
            </div>
          </div>

          {/* Facebook Lead Ads */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="mb-5 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Facebook Lead Ads</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  fbForm.facebook_page_id
                    ? "bg-emerald-400/10 text-emerald-400"
                    : "bg-white/[0.06] text-white/30"
                }`}
              >
                {fbForm.facebook_page_id ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Facebook Page ID</label>
                <input
                  type="text"
                  value={fbForm.facebook_page_id}
                  onChange={(e) =>
                    setFbForm((p) => ({ ...p, facebook_page_id: e.target.value }))
                  }
                  placeholder="123456789012345"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Page Access Token</label>
                <div className="flex gap-2">
                  <input
                    type={showFbToken ? "text" : "password"}
                    value={fbForm.facebook_access_token}
                    onChange={(e) =>
                      setFbForm((p) => ({ ...p, facebook_access_token: e.target.value }))
                    }
                    placeholder="EAAxxxxxxxx…"
                    className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFbToken((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                  >
                    {showFbToken ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-white/30">
                  Get this from Meta Business Suite → Settings → Page Access Tokens
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Verify Token
                  <span className="ml-1.5 font-normal text-white/25">(read-only)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fbForm.facebook_verify_token}
                    className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.02] px-3 font-mono text-xs text-white/50 outline-none select-all"
                  />
                  <CopyButton copied={vtCopied} onClick={copyVerifyToken} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Webhook URL
                  <span className="ml-1.5 font-normal text-white/25">(read-only)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={WEBHOOK_URL}
                    className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.02] px-3 font-mono text-xs text-white/50 outline-none select-all"
                  />
                  <CopyButton copied={urlCopied} onClick={copyWebhookUrl} />
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-2 text-xs font-medium text-white/40">Webhook setup</p>
                <ol className="flex flex-col gap-1.5 text-xs text-white/35 leading-relaxed list-none">
                  <li>1. Go to <span className="text-white/60">Meta for Developers → Your App → Webhooks</span></li>
                  <li>2. Add the Webhook URL above as callback URL</li>
                  <li>3. Paste the Verify Token above</li>
                  <li>4. Subscribe to <span className="text-white/60">leadgen</span> on the <span className="text-white/60">Page</span> object</li>
                </ol>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton
                loading={fbSaving}
                saved={fbSaved}
                onClick={saveFacebook}
                label="Save Facebook"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications tab ──────────────────────────────────────────────── */}
      {tab === "notifications" && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="mb-1 text-sm font-semibold text-white">Email notifications</h2>
          <p className="mb-5 text-xs text-white/40">
            Notifications will be sent to{" "}
            <span className="text-white/70">{userEmail}</span>
          </p>
          <div className="flex flex-col gap-5">
            <Toggle
              checked={notifForm.new_lead}
              onChange={(v) => setNotifForm((p) => ({ ...p, new_lead: v }))}
              label="New lead received"
              description="Get notified when your agent captures a new lead via SMS or Facebook Ads"
            />
            <div className="border-t border-white/[0.05]" />
            <Toggle
              checked={notifForm.deal_closed}
              onChange={(v) => setNotifForm((p) => ({ ...p, deal_closed: v }))}
              label="Deal closed"
              description="Get notified when a lead's status is updated to closed"
            />
          </div>
          <div className="mt-6 flex justify-end">
            <SaveButton
              loading={notifSaving}
              saved={notifSaved}
              onClick={saveNotifications}
            />
          </div>
        </div>
      )}
    </div>
  );
}
