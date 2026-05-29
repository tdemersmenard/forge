"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AgentRow } from "./page";

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTORS = [
  { id: "pool", label: "Pool & Spa", emoji: "🏊" },
  { id: "lawn", label: "Lawn & Landscaping", emoji: "🌿" },
  { id: "cleaning", label: "Cleaning", emoji: "🏠" },
  { id: "hvac", label: "HVAC", emoji: "🔧" },
  { id: "construction", label: "Construction & Renovation", emoji: "🔨" },
  { id: "other", label: "Other", emoji: "✨" },
];

const TONES = [
  { id: "professional", label: "Professional", emoji: "🎯" },
  { id: "friendly", label: "Friendly", emoji: "😊" },
  { id: "direct", label: "Direct", emoji: "⚡" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const UNITS = ["fixed", "per visit", "per sqft", "custom"];
const CONTRACT_VALUES = ["Under $500", "$500–$2,000", "$2,000–$5,000", "$5,000+"];

const WEBHOOK_URL = `${
  process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-zeta-silk.vercel.app"
}/api/webhook/facebook`;

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = { id: string; name: string; price: string; unit: string };

type Tab =
  | "identity"
  | "services"
  | "qualification"
  | "personality"
  | "instructions"
  | "integrations"
  | "notifications";

// ─── Helper components ────────────────────────────────────────────────────────

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

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
    >
      {copied ? "Copied ✓" : "Copy"}
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

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <h2 className="mb-5 text-sm font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/50">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors";
const textareaCls =
  "rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors resize-none";

function newService(): ServiceItem {
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    price: "",
    unit: "fixed",
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  agent: AgentRow | null;
  userEmail: string;
}

export function SettingsClient({ agent, userEmail }: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("identity");

  // ── Identity ─────────────────────────────────────────────────────────────
  const [identityForm, setIdentityForm] = useState({
    agent_name: agent?.agent_name ?? "",
    business_name: agent?.business_name ?? "",
    sector: agent?.sector ?? "",
  });
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identitySaved, setIdentitySaved] = useState(false);

  // ── Services ─────────────────────────────────────────────────────────────
  const [servicesList, setServicesList] = useState<ServiceItem[]>(
    agent?.services_list?.map((s) => ({ ...s, id: Math.random().toString(36).slice(2) })) ??
      [newService()]
  );
  const [contractValue, setContractValue] = useState(agent?.contract_value ?? "");
  const [servicesSaving, setServicesSaving] = useState(false);
  const [servicesSaved, setServicesSaved] = useState(false);

  // ── Qualification ─────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<string[]>(
    agent?.qualification_questions ?? [""]
  );
  const [disqualification, setDisqualification] = useState(
    agent?.disqualification_criteria ?? ""
  );
  const [qualSaving, setQualSaving] = useState(false);
  const [qualSaved, setQualSaved] = useState(false);

  // ── Personality ───────────────────────────────────────────────────────────
  const [personalityForm, setPersonalityForm] = useState({
    tone: agent?.tone ?? "",
    language: agent?.language ?? "FR",
    bilingual: agent?.bilingual ?? false,
    openDays: agent?.business_hours?.days ?? ["Mon", "Tue", "Wed", "Thu", "Fri"],
    openTime: agent?.business_hours?.openTime ?? "09:00",
    closeTime: agent?.business_hours?.closeTime ?? "18:00",
  });
  const [personalitySaving, setPersonalitySaving] = useState(false);
  const [personalitySaved, setPersonalitySaved] = useState(false);

  // ── Instructions ──────────────────────────────────────────────────────────
  const [instructionsForm, setInstructionsForm] = useState({
    service_area: agent?.service_area ?? "",
    promotions: agent?.promotions ?? "",
    never_say: agent?.never_say ?? "",
    escalation_criteria: agent?.escalation_criteria ?? "",
  });
  const [instructionsSaving, setInstructionsSaving] = useState(false);
  const [instructionsSaved, setInstructionsSaved] = useState(false);

  // ── Integrations ──────────────────────────────────────────────────────────
  const [twilioForm, setTwilioForm] = useState({
    phone: agent?.phone ?? "",
    twilio_account_sid: agent?.twilio_account_sid ?? "",
    twilio_auth_token: agent?.twilio_auth_token ?? "",
  });
  const [twilioSaving, setTwilioSaving] = useState(false);
  const [twilioSaved, setTwilioSaved] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [twilioTestStatus, setTwilioTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [twilioTestError, setTwilioTestError] = useState<string | null>(null);

  const [fbForm, setFbForm] = useState({
    facebook_page_id: agent?.facebook_page_id ?? "",
    facebook_access_token: agent?.facebook_access_token ?? "",
    facebook_verify_token: agent?.facebook_verify_token ?? "",
  });
  const [fbSaving, setFbSaving] = useState(false);
  const [fbSaved, setFbSaved] = useState(false);
  const [showFbToken, setShowFbToken] = useState(false);
  const [vtCopied, setVtCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifForm, setNotifForm] = useState({
    new_lead: agent?.notifications_prefs?.new_lead ?? true,
    deal_closed: agent?.notifications_prefs?.deal_closed ?? true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // ── Save helpers ──────────────────────────────────────────────────────────

  async function markSaved(
    setSaving: (v: boolean) => void,
    setSaved: (v: boolean) => void
  ) {
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveIdentity() {
    if (!agent) return;
    setIdentitySaving(true);
    await supabase.from("agents").update(identityForm).eq("id", agent.id);
    await markSaved(setIdentitySaving, setIdentitySaved);
  }

  async function saveServices() {
    if (!agent) return;
    setServicesSaving(true);
    const filtered = servicesList.filter((s) => s.name.trim());
    await supabase
      .from("agents")
      .update({
        services_list: filtered,
        services: filtered.map((s) => `${s.name} (${s.price} ${s.unit})`).join(", "),
        contract_value: contractValue,
      })
      .eq("id", agent.id);
    await markSaved(setServicesSaving, setServicesSaved);
  }

  async function saveQualification() {
    if (!agent) return;
    setQualSaving(true);
    await supabase
      .from("agents")
      .update({
        qualification_questions: questions.filter((q) => q.trim()),
        disqualification_criteria: disqualification || null,
      })
      .eq("id", agent.id);
    await markSaved(setQualSaving, setQualSaved);
  }

  async function savePersonality() {
    if (!agent) return;
    setPersonalitySaving(true);
    await supabase
      .from("agents")
      .update({
        tone: personalityForm.tone,
        language: personalityForm.language,
        bilingual: personalityForm.bilingual,
        business_hours: {
          openTime: personalityForm.openTime,
          closeTime: personalityForm.closeTime,
          days: personalityForm.openDays,
        },
      })
      .eq("id", agent.id);
    await markSaved(setPersonalitySaving, setPersonalitySaved);
  }

  async function saveInstructions() {
    if (!agent) return;
    setInstructionsSaving(true);
    await supabase
      .from("agents")
      .update({
        service_area: instructionsForm.service_area || null,
        promotions: instructionsForm.promotions || null,
        never_say: instructionsForm.never_say || null,
        escalation_criteria: instructionsForm.escalation_criteria || null,
      })
      .eq("id", agent.id);
    await markSaved(setInstructionsSaving, setInstructionsSaved);
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

  async function testTwilio() {
    setTwilioTestStatus("loading");
    setTwilioTestError(null);
    try {
      const res = await fetch("/api/twilio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilio_account_sid: twilioForm.twilio_account_sid,
          twilio_auth_token: twilioForm.twilio_auth_token,
          phone: twilioForm.phone,
        }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        setTwilioTestStatus("success");
      } else {
        setTwilioTestStatus("error");
        setTwilioTestError(data.error ?? "Invalid credentials.");
      }
    } catch {
      setTwilioTestStatus("error");
      setTwilioTestError("Network error — try again.");
    }
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

  // ── Service list helpers ──────────────────────────────────────────────────

  function addService() {
    if (servicesList.length >= 10) return;
    setServicesList((prev) => [...prev, newService()]);
  }

  function removeService(id: string) {
    if (servicesList.length <= 1) return;
    setServicesList((prev) => prev.filter((s) => s.id !== id));
  }

  function updateService(
    id: string,
    field: keyof Omit<ServiceItem, "id">,
    value: string
  ) {
    setServicesList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  // ── Question list helpers ─────────────────────────────────────────────────

  function addQuestion() {
    if (questions.length >= 8) return;
    setQuestions((prev) => [...prev, ""]);
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateQuestion(i: number, value: string) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? value : q)));
  }

  function toggleDay(day: string) {
    setPersonalityForm((prev) => ({
      ...prev,
      openDays: prev.openDays.includes(day)
        ? prev.openDays.filter((d) => d !== day)
        : [...prev.openDays, day],
    }));
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "identity", label: "Identity" },
    { key: "services", label: "Services" },
    { key: "qualification", label: "Qualification" },
    { key: "personality", label: "Personality" },
    { key: "instructions", label: "Instructions" },
    { key: "integrations", label: "Integrations" },
    { key: "notifications", label: "Notifications" },
  ];

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-2 text-sm font-medium text-white/50">
          No agent configured
        </p>
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
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-[#0a0a0a]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════ IDENTITY ════════════════════════ */}
      {tab === "identity" && (
        <SectionCard title="Agent identity">
          <div className="flex flex-col gap-4">
            <Field label="Agent name">
              <input
                type="text"
                value={identityForm.agent_name}
                onChange={(e) =>
                  setIdentityForm((p) => ({ ...p, agent_name: e.target.value }))
                }
                placeholder="Max, Sophie, Alex..."
                className={inputCls}
              />
            </Field>
            <Field label="Business name">
              <input
                type="text"
                value={identityForm.business_name}
                onChange={(e) =>
                  setIdentityForm((p) => ({
                    ...p,
                    business_name: e.target.value,
                  }))
                }
                className={inputCls}
              />
            </Field>
            <Field label="Sector">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SECTORS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setIdentityForm((p) => ({ ...p, sector: s.id }))
                    }
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                      identityForm.sector === s.id
                        ? "border-white bg-white/[0.06] text-white"
                        : "border-white/[0.07] text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    <span>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <SaveButton
              loading={identitySaving}
              saved={identitySaved}
              onClick={saveIdentity}
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ SERVICES ════════════════════════ */}
      {tab === "services" && (
        <SectionCard title="Services & pricing">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {servicesList.map((svc) => (
                <div key={svc.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={svc.name}
                    onChange={(e) =>
                      updateService(svc.id, "name", e.target.value)
                    }
                    placeholder="Service name"
                    className="h-10 flex-[3] rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                  <div className="flex items-center">
                    <span className="mr-1 text-xs text-white/30">$</span>
                    <input
                      type="number"
                      value={svc.price}
                      onChange={(e) =>
                        updateService(svc.id, "price", e.target.value)
                      }
                      placeholder="0"
                      className="h-10 w-20 rounded-md border border-white/10 bg-white/[0.04] px-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                  <select
                    value={svc.unit}
                    onChange={(e) =>
                      updateService(svc.id, "unit", e.target.value)
                    }
                    className="h-10 rounded-md border border-white/10 bg-[#0a0a0a] px-2 text-xs text-white/60 outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeService(svc.id)}
                    disabled={servicesList.length <= 1}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/[0.06] text-white/25 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-25"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6h8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {servicesList.length < 10 && (
                <button
                  type="button"
                  onClick={addService}
                  className="flex w-fit items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/70"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 2v8M2 6h8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Add a service
                </button>
              )}
            </div>

            <Field label="Average contract value">
              <div className="flex flex-wrap gap-2">
                {CONTRACT_VALUES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setContractValue(v)}
                    className={`rounded-full border px-4 py-1 text-xs transition-colors ${
                      contractValue === v
                        ? "border-white bg-white/[0.08] text-white"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <SaveButton
              loading={servicesSaving}
              saved={servicesSaved}
              onClick={saveServices}
              label="Save services"
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ QUALIFICATION ════════════════════════ */}
      {tab === "qualification" && (
        <SectionCard title="Lead qualification">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-white/50">
                Qualification questions
              </label>
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs text-white/20">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    placeholder={`Question ${i + 1}`}
                    className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/[0.06] text-white/25 transition-colors hover:border-red-500/30 hover:text-red-400"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6h8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {questions.length < 8 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="ml-7 flex w-fit items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/70"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 2v8M2 6h8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Add a question
                </button>
              )}
            </div>

            <Field label="When should your agent stop the conversation?">
              <textarea
                value={disqualification}
                onChange={(e) => setDisqualification(e.target.value)}
                rows={3}
                placeholder="Ex: If client is outside our service area, or budget is under $500."
                className={textareaCls}
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <SaveButton
              loading={qualSaving}
              saved={qualSaved}
              onClick={saveQualification}
              label="Save qualification"
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ PERSONALITY ════════════════════════ */}
      {tab === "personality" && (
        <SectionCard title="Agent personality">
          <div className="flex flex-col gap-6">
            <Field label="Tone">
              <div className="flex gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setPersonalityForm((p) => ({ ...p, tone: t.id }))
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm transition-colors ${
                      personalityForm.tone === t.id
                        ? "border-white bg-white/[0.06] text-white"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Language">
              <div className="flex gap-2">
                {["FR", "EN"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() =>
                      setPersonalityForm((p) => ({ ...p, language: lang }))
                    }
                    className={`rounded-full border px-5 py-1.5 text-sm transition-colors ${
                      personalityForm.language === lang
                        ? "border-white bg-white/[0.06] text-white"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {lang === "FR" ? "🇫🇷 Français" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
            </Field>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={personalityForm.bilingual}
                onChange={(e) =>
                  setPersonalityForm((p) => ({
                    ...p,
                    bilingual: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded accent-white"
              />
              <span className="text-sm text-white/60">
                Respond in both languages automatically
              </span>
            </label>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-white/50">
                Business hours
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/35">Opens at</span>
                  <input
                    type="time"
                    value={personalityForm.openTime}
                    onChange={(e) =>
                      setPersonalityForm((p) => ({
                        ...p,
                        openTime: e.target.value,
                      }))
                    }
                    className="h-9 rounded-md border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/35">Closes at</span>
                  <input
                    type="time"
                    value={personalityForm.closeTime}
                    onChange={(e) =>
                      setPersonalityForm((p) => ({
                        ...p,
                        closeTime: e.target.value,
                      }))
                    }
                    className="h-9 rounded-md border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none focus:border-white/25 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      personalityForm.openDays.includes(d)
                        ? "border-white bg-white/[0.08] text-white"
                        : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <SaveButton
              loading={personalitySaving}
              saved={personalitySaved}
              onClick={savePersonality}
              label="Save personality"
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ INSTRUCTIONS ════════════════════════ */}
      {tab === "instructions" && (
        <SectionCard title="Special instructions">
          <div className="flex flex-col gap-4">
            <Field label="Cities or regions you serve">
              <input
                type="text"
                value={instructionsForm.service_area}
                onChange={(e) =>
                  setInstructionsForm((p) => ({
                    ...p,
                    service_area: e.target.value,
                  }))
                }
                placeholder="Ex: Granby, Bromont, Waterloo"
                className={inputCls}
              />
            </Field>
            <Field label="Active promotions">
              <textarea
                value={instructionsForm.promotions}
                onChange={(e) =>
                  setInstructionsForm((p) => ({
                    ...p,
                    promotions: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Ex: 10% off pool opening before May 31st"
                className={textareaCls}
              />
            </Field>
            <Field label="Topics your agent should avoid">
              <textarea
                value={instructionsForm.never_say}
                onChange={(e) =>
                  setInstructionsForm((p) => ({
                    ...p,
                    never_say: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Ex: Never discuss competitor pricing."
                className={textareaCls}
              />
            </Field>
            <Field label="When should the agent flag a conversation for you?">
              <textarea
                value={instructionsForm.escalation_criteria}
                onChange={(e) =>
                  setInstructionsForm((p) => ({
                    ...p,
                    escalation_criteria: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Ex: If client is angry, if deal is over $5,000."
                className={textareaCls}
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <SaveButton
              loading={instructionsSaving}
              saved={instructionsSaved}
              onClick={saveInstructions}
              label="Save instructions"
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ INTEGRATIONS ════════════════════════ */}
      {tab === "integrations" && (
        <div className="flex flex-col gap-6">
          {/* Twilio */}
          <SectionCard title="Twilio — SMS">
            <div className="flex flex-col gap-4">
              <Field label="Phone number">
                <input
                  type="tel"
                  value={twilioForm.phone}
                  onChange={(e) =>
                    setTwilioForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+15551234567"
                  className={inputCls}
                />
              </Field>
              <Field label="Account SID">
                <input
                  type="text"
                  value={twilioForm.twilio_account_sid}
                  onChange={(e) =>
                    setTwilioForm((p) => ({
                      ...p,
                      twilio_account_sid: e.target.value,
                    }))
                  }
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Auth Token">
                <div className="flex gap-2">
                  <input
                    type={showTwilioToken ? "text" : "password"}
                    value={twilioForm.twilio_auth_token}
                    onChange={(e) =>
                      setTwilioForm((p) => ({
                        ...p,
                        twilio_auth_token: e.target.value,
                      }))
                    }
                    placeholder="Your Twilio Auth Token"
                    className={`${inputCls} flex-1 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTwilioToken((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/40 transition-colors hover:text-white/70"
                  >
                    {showTwilioToken ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="7"
                          cy="7"
                          r="1.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M2 2l10 10"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="7"
                          cy="7"
                          r="1.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </Field>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={testTwilio}
                  disabled={
                    twilioTestStatus === "loading" ||
                    !twilioForm.twilio_account_sid ||
                    !twilioForm.twilio_auth_token
                  }
                  className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  {twilioTestStatus === "loading" ? "Testing…" : "Test connection"}
                </button>
                {twilioTestStatus === "success" && (
                  <span className="text-sm text-emerald-400">✓ Connected</span>
                )}
                {twilioTestStatus === "error" && (
                  <span className="text-sm text-red-400">✗ {twilioTestError}</span>
                )}
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
          </SectionCard>

          {/* Facebook Lead Ads */}
          <SectionCard title="Facebook Lead Ads">
            <div className="flex flex-col gap-4">
              <Field label="Facebook Page ID">
                <input
                  type="text"
                  value={fbForm.facebook_page_id}
                  onChange={(e) =>
                    setFbForm((p) => ({
                      ...p,
                      facebook_page_id: e.target.value,
                    }))
                  }
                  placeholder="123456789012345"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Page Access Token">
                <div className="flex gap-2">
                  <input
                    type={showFbToken ? "text" : "password"}
                    value={fbForm.facebook_access_token}
                    onChange={(e) =>
                      setFbForm((p) => ({
                        ...p,
                        facebook_access_token: e.target.value,
                      }))
                    }
                    placeholder="EAAxxxxxxxx…"
                    className={`${inputCls} flex-1 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFbToken((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/40 transition-colors hover:text-white/70"
                  >
                    {showFbToken ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="7"
                          cy="7"
                          r="1.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M2 2l10 10"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="7"
                          cy="7"
                          r="1.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </Field>
              <Field label="Verify Token (read-only)">
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fbForm.facebook_verify_token}
                    className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.02] px-3 font-mono text-xs text-white/50 outline-none select-all"
                  />
                  <CopyButton copied={vtCopied} onClick={copyVerifyToken} />
                </div>
              </Field>
              <Field label="Webhook URL (read-only)">
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={WEBHOOK_URL}
                    className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.02] px-3 font-mono text-xs text-white/50 outline-none select-all"
                  />
                  <CopyButton copied={urlCopied} onClick={copyWebhookUrl} />
                </div>
              </Field>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-2 text-xs font-medium text-white/40">
                  Webhook setup
                </p>
                <ol className="flex flex-col gap-1.5 list-none text-xs leading-relaxed text-white/35">
                  <li>1. Go to Meta for Developers → Your App → Webhooks</li>
                  <li>2. Add the Webhook URL above as callback URL</li>
                  <li>3. Paste the Verify Token above</li>
                  <li>
                    4. Subscribe to{" "}
                    <span className="text-white/60">leadgen</span> on the{" "}
                    <span className="text-white/60">Page</span> object
                  </li>
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
          </SectionCard>
        </div>
      )}

      {/* ════════════════════════ NOTIFICATIONS ════════════════════════ */}
      {tab === "notifications" && (
        <SectionCard title="Email notifications">
          <p className="mb-5 text-xs text-white/40">
            Notifications sent to{" "}
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
              onChange={(v) =>
                setNotifForm((p) => ({ ...p, deal_closed: v }))
              }
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
        </SectionCard>
      )}
    </div>
  );
}
