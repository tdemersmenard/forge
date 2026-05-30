"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { AgentRow } from "./page";

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTORS = [
  { id: "pool", emoji: "🏊" },
  { id: "lawn", emoji: "🌿" },
  { id: "cleaning", emoji: "🏠" },
  { id: "hvac", emoji: "🔧" },
  { id: "construction", emoji: "🔨" },
  { id: "other", emoji: "✨" },
];

const TONES = [
  { id: "professional", emoji: "🎯" },
  { id: "friendly", emoji: "😊" },
  { id: "direct", emoji: "⚡" },
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
  label,
}: {
  loading: boolean;
  saved: boolean;
  onClick: () => void;
  label?: string;
}) {
  const t = useTranslations("settings");
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {loading ? t("saving") : saved ? t("saved") : (label ?? t("saveChanges"))}
    </button>
  );
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  const t = useTranslations("settings");
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
    >
      {copied ? t("integrations.copied") : t("integrations.copy")}
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

async function callAgentUpdate(
  section: "identity" | "services" | "qualification" | "personality" | "instructions" | "twilio" | "facebook" | "notifications",
  data: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/agent/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      return { ok: false, error: body.error ?? "Save failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export function SettingsClient({ agent, userEmail }: Props) {
  const t = useTranslations("settings");
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
    twilio_auth_token: "", // never pre-filled — must be re-entered to change
  });
  const [twilioSaving, setTwilioSaving] = useState(false);
  const [twilioSaved, setTwilioSaved] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [editingTwilioToken, setEditingTwilioToken] = useState(!agent?._twilioConfigured);
  const [twilioTestStatus, setTwilioTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [twilioTestError, setTwilioTestError] = useState<string | null>(null);

  const [fbForm, setFbForm] = useState({
    facebook_page_id: agent?.facebook_page_id ?? "",
    facebook_access_token: "", // never pre-filled
    facebook_verify_token: "", // never pre-filled
  });
  const [fbSaving, setFbSaving] = useState(false);
  const [fbSaved, setFbSaved] = useState(false);
  const [showFbToken, setShowFbToken] = useState(false);
  const [editingFbTokens, setEditingFbTokens] = useState(!agent?._facebookConfigured);
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
    const result = await callAgentUpdate("identity", identityForm);
    if (!result.ok) {
      toast.error(result.error ?? "Save failed");
      setIdentitySaving(false);
      return;
    }
    await markSaved(setIdentitySaving, setIdentitySaved);
  }

  async function saveServices() {
    if (!agent) return;
    setServicesSaving(true);
    const filtered = servicesList.filter((s) => s.name.trim());
    const result = await callAgentUpdate("services", {
      services_list: filtered,
      services: filtered.map((s) => `${s.name} (${s.price} ${s.unit})`).join(", "),
      contract_value: contractValue,
    });
    if (!result.ok) {
      toast.error(result.error ?? "Save failed");
      setServicesSaving(false);
      return;
    }
    await markSaved(setServicesSaving, setServicesSaved);
  }

  async function saveQualification() {
    if (!agent) return;
    setQualSaving(true);
    const result = await callAgentUpdate("qualification", {
      qualification_questions: questions.filter((q) => q.trim()),
      disqualification_criteria: disqualification || null,
    });
    if (!result.ok) {
      toast.error(result.error ?? "Save failed");
      setQualSaving(false);
      return;
    }
    await markSaved(setQualSaving, setQualSaved);
  }

  async function savePersonality() {
    if (!agent) return;
    setPersonalitySaving(true);
    const result = await callAgentUpdate("personality", {
      tone: personalityForm.tone,
      language: personalityForm.language,
      bilingual: personalityForm.bilingual,
      business_hours: {
        openTime: personalityForm.openTime,
        closeTime: personalityForm.closeTime,
        days: personalityForm.openDays,
      },
    });
    if (!result.ok) {
      toast.error(result.error ?? "Save failed");
      setPersonalitySaving(false);
      return;
    }
    await markSaved(setPersonalitySaving, setPersonalitySaved);
  }

  async function saveInstructions() {
    if (!agent) return;
    setInstructionsSaving(true);
    const result = await callAgentUpdate("instructions", {
      service_area: instructionsForm.service_area || null,
      promotions: instructionsForm.promotions || null,
      never_say: instructionsForm.never_say || null,
      escalation_criteria: instructionsForm.escalation_criteria || null,
    });
    if (!result.ok) {
      toast.error(result.error ?? "Save failed");
      setInstructionsSaving(false);
      return;
    }
    await markSaved(setInstructionsSaving, setInstructionsSaved);
  }

  async function saveTwilio() {
    if (!agent) return;
    setTwilioSaving(true);
    const payload: Record<string, string> = {
      phone: twilioForm.phone,
      twilio_account_sid: twilioForm.twilio_account_sid,
    };
    if (twilioForm.twilio_auth_token.length > 0) {
      payload.twilio_auth_token = twilioForm.twilio_auth_token;
    }
    const result = await callAgentUpdate("twilio", payload);
    if (!result.ok) {
      toast.error(result.error ?? "Save failed");
      setTwilioSaving(false);
      return;
    }
    setTwilioForm((p) => ({ ...p, twilio_auth_token: "" }));
    setEditingTwilioToken(false);
    await markSaved(setTwilioSaving, setTwilioSaved);
  }

  async function saveFacebook() {
    if (!agent) return;
    setFbSaving(true);
    const payload: Record<string, string> = {
      facebook_page_id: fbForm.facebook_page_id,
    };
    if (fbForm.facebook_access_token.length > 0) {
      payload.facebook_access_token = fbForm.facebook_access_token;
    }
    if (fbForm.facebook_verify_token.length > 0) {
      payload.facebook_verify_token = fbForm.facebook_verify_token;
    }
    const result = await callAgentUpdate("facebook", payload);
    if (!result.ok) {
      toast.error(result.error ?? "Save failed");
      setFbSaving(false);
      return;
    }
    setFbForm((p) => ({ ...p, facebook_access_token: "", facebook_verify_token: "" }));
    setEditingFbTokens(false);
    await markSaved(setFbSaving, setFbSaved);
  }

  async function saveNotifications() {
    if (!agent) return;
    setNotifSaving(true);
    const result = await callAgentUpdate("notifications", { notifications_prefs: notifForm });
    if (!result.ok) {
      toast.error(result.error ?? "Save failed");
      setNotifSaving(false);
      return;
    }
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
        setTwilioTestError(data.error ?? t("integrations.invalidCreds"));
      }
    } catch {
      setTwilioTestStatus("error");
      setTwilioTestError(t("integrations.networkError"));
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
    { key: "identity", label: t("tabs.identity") },
    { key: "services", label: t("tabs.services") },
    { key: "qualification", label: t("tabs.qualification") },
    { key: "personality", label: t("tabs.personality") },
    { key: "instructions", label: t("tabs.instructions") },
    { key: "integrations", label: t("tabs.integrations") },
    { key: "notifications", label: t("tabs.notifications") },
  ];

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-2 text-sm font-medium text-white/50">
          {t("noAgent")}
        </p>
        <a
          href="/onboarding"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
        >
          {t("setupAgent")}
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === tabItem.key
                ? "bg-white text-[#0a0a0a]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════ IDENTITY ════════════════════════ */}
      {tab === "identity" && (
        <SectionCard title={t("identity.sectionTitle")}>
          <div className="flex flex-col gap-4">
            <Field label={t("identity.agentName")}>
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
            <Field label={t("identity.businessName")}>
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
            <Field label={t("identity.sector")}>
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
                    {t(`identity.sectors.${s.id}`)}
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
        <SectionCard title={t("services.sectionTitle")}>
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
                    placeholder={t("services.servicePlaceholder")}
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
                  {t("services.addService")}
                </button>
              )}
            </div>

            <Field label={t("services.contractValue")}>
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
              label={t("saveServices")}
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ QUALIFICATION ════════════════════════ */}
      {tab === "qualification" && (
        <SectionCard title={t("qualification.sectionTitle")}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-white/50">
                {t("qualification.questionsLabel")}
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
                    placeholder={t("qualification.questionPlaceholder", { n: i + 1 })}
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
                  {t("qualification.addQuestion")}
                </button>
              )}
            </div>

            <Field label={t("qualification.disqualLabel")}>
              <textarea
                value={disqualification}
                onChange={(e) => setDisqualification(e.target.value)}
                rows={3}
                placeholder={t("qualification.disqualPlaceholder")}
                className={textareaCls}
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <SaveButton
              loading={qualSaving}
              saved={qualSaved}
              onClick={saveQualification}
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ PERSONALITY ════════════════════════ */}
      {tab === "personality" && (
        <SectionCard title={t("personality.sectionTitle")}>
          <div className="flex flex-col gap-6">
            <Field label={t("personality.toneLabel")}>
              <div className="flex gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() =>
                      setPersonalityForm((p) => ({ ...p, tone: tone.id }))
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm transition-colors ${
                      personalityForm.tone === tone.id
                        ? "border-white bg-white/[0.06] text-white"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    <span>{tone.emoji}</span>
                    {t(`personality.tones.${tone.id}`)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t("personality.languageLabel")}>
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
                {t("personality.bilingualDesc")}
              </span>
            </label>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-white/50">
                {t("personality.hoursLabel")}
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/35">{t("personality.openLabel")}</span>
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
                  <span className="text-xs text-white/35">{t("personality.closesLabel")}</span>
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
                    {t(`personality.days.${d}`)}
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
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ INSTRUCTIONS ════════════════════════ */}
      {tab === "instructions" && (
        <SectionCard title={t("instructions.sectionTitle")}>
          <div className="flex flex-col gap-4">
            <Field label={t("instructions.serviceAreaLabel")}>
              <input
                type="text"
                value={instructionsForm.service_area}
                onChange={(e) =>
                  setInstructionsForm((p) => ({
                    ...p,
                    service_area: e.target.value,
                  }))
                }
                placeholder={t("instructions.serviceAreaPlaceholder")}
                className={inputCls}
              />
            </Field>
            <Field label={t("instructions.promotionsLabel")}>
              <textarea
                value={instructionsForm.promotions}
                onChange={(e) =>
                  setInstructionsForm((p) => ({
                    ...p,
                    promotions: e.target.value,
                  }))
                }
                rows={2}
                placeholder={t("instructions.promotionsPlaceholder")}
                className={textareaCls}
              />
            </Field>
            <Field label={t("instructions.neverSayLabel")}>
              <textarea
                value={instructionsForm.never_say}
                onChange={(e) =>
                  setInstructionsForm((p) => ({
                    ...p,
                    never_say: e.target.value,
                  }))
                }
                rows={2}
                placeholder={t("instructions.neverSayPlaceholder")}
                className={textareaCls}
              />
            </Field>
            <Field label={t("instructions.escalationLabel")}>
              <textarea
                value={instructionsForm.escalation_criteria}
                onChange={(e) =>
                  setInstructionsForm((p) => ({
                    ...p,
                    escalation_criteria: e.target.value,
                  }))
                }
                rows={2}
                placeholder={t("instructions.escalationPlaceholder")}
                className={textareaCls}
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <SaveButton
              loading={instructionsSaving}
              saved={instructionsSaved}
              onClick={saveInstructions}
            />
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════ INTEGRATIONS ════════════════════════ */}
      {tab === "integrations" && (
        <div className="flex flex-col gap-6">
          {/* Twilio */}
          <SectionCard title={t("integrations.twilioTitle")}>
            <div className="flex flex-col gap-4">
              <Field label={t("integrations.phone")}>
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
              <Field label={t("integrations.accountSid")}>
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
              <Field label={t("integrations.authToken")}>
                {editingTwilioToken ? (
                  <div className="flex flex-col gap-2">
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
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                            <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {agent?._twilioConfigured && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTwilioToken(false);
                          setTwilioForm((p) => ({ ...p, twilio_auth_token: "" }));
                        }}
                        className="w-fit text-xs text-white/30 underline underline-offset-2 hover:text-white/60"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex h-10 items-center gap-3">
                    <span className="text-sm text-white/40 font-mono">•••••••••••••••• (configured)</span>
                    <button
                      type="button"
                      onClick={() => setEditingTwilioToken(true)}
                      className="text-xs text-white/40 underline underline-offset-2 hover:text-white/70"
                    >
                      Replace
                    </button>
                  </div>
                )}
              </Field>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={testTwilio}
                  disabled={
                    twilioTestStatus === "loading" ||
                    !twilioForm.twilio_account_sid ||
                    (!twilioForm.twilio_auth_token && !agent?._twilioConfigured)
                  }
                  className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  {twilioTestStatus === "loading" ? t("integrations.testing") : t("integrations.testConnection")}
                </button>
                {twilioTestStatus === "success" && (
                  <span className="text-sm text-emerald-400">✓ {t("integrations.connected")}</span>
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
              />
            </div>
          </SectionCard>

          {/* Facebook Lead Ads */}
          <SectionCard title={t("integrations.facebookTitle")}>
            <div className="flex flex-col gap-4">
              <Field label={t("integrations.pageId")}>
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
              <Field label={t("integrations.accessToken")}>
                {editingFbTokens ? (
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
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex h-10 items-center gap-3">
                    <span className="text-sm text-white/40 font-mono">•••••••••••••••• (configured)</span>
                    <button
                      type="button"
                      onClick={() => setEditingFbTokens(true)}
                      className="text-xs text-white/40 underline underline-offset-2 hover:text-white/70"
                    >
                      Replace
                    </button>
                  </div>
                )}
              </Field>
              <Field label={t("integrations.verifyToken")}>
                {editingFbTokens ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={fbForm.facebook_verify_token}
                      onChange={(e) =>
                        setFbForm((p) => ({
                          ...p,
                          facebook_verify_token: e.target.value,
                        }))
                      }
                      placeholder="my-verify-token"
                      className={`${inputCls} font-mono`}
                    />
                    {agent?._facebookConfigured && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFbTokens(false);
                          setFbForm((p) => ({ ...p, facebook_access_token: "", facebook_verify_token: "" }));
                        }}
                        className="w-fit text-xs text-white/30 underline underline-offset-2 hover:text-white/60"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex h-10 items-center gap-3">
                    <span className="text-sm text-white/40 font-mono">•••••••••••••••• (configured)</span>
                  </div>
                )}
              </Field>
              <Field label={`${t("integrations.webhookLabel")} (read-only)`}>
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
              />
            </div>
          </SectionCard>
        </div>
      )}

      {/* ════════════════════════ NOTIFICATIONS ════════════════════════ */}
      {tab === "notifications" && (
        <SectionCard title={t("notifications.sectionTitle")}>
          <p className="mb-5 text-xs text-white/40">
            {t("notifications.sentTo")}{" "}
            <span className="text-white/70">{userEmail}</span>
          </p>
          <div className="flex flex-col gap-5">
            <Toggle
              checked={notifForm.new_lead}
              onChange={(v) => setNotifForm((p) => ({ ...p, new_lead: v }))}
              label={t("notifications.newLead")}
              description={t("notifications.newLeadDesc")}
            />
            <div className="border-t border-white/[0.05]" />
            <Toggle
              checked={notifForm.deal_closed}
              onChange={(v) =>
                setNotifForm((p) => ({ ...p, deal_closed: v }))
              }
              label={t("notifications.dealClosed")}
              description={t("notifications.dealClosedDesc")}
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
