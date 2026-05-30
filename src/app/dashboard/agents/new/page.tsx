"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTORS = [
  { id: "pool", emoji: "🏊", label: "Pool & Spa" },
  { id: "lawn", emoji: "🌿", label: "Lawn & Landscaping" },
  { id: "cleaning", emoji: "🏠", label: "Cleaning" },
  { id: "hvac", emoji: "🔧", label: "HVAC" },
  { id: "construction", emoji: "🔨", label: "Construction" },
  { id: "other", emoji: "✨", label: "Other" },
] as const;

const TONES = [
  { id: "professional", emoji: "🎯", label: "Professional", desc: "Formal, precise, builds trust fast." },
  { id: "friendly", emoji: "😊", label: "Friendly", desc: "Warm, approachable, feels human." },
  { id: "direct", emoji: "⚡", label: "Direct", desc: "Fast, no fluff, straight to the point." },
] as const;

const CONTRACT_VALUES = ["Under $500", "$500–$2,000", "$2,000–$5,000", "$5,000+"];
const UNITS = ["fixed", "per visit", "per sqft", "custom"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TOTAL_STEPS = 7;

const WEBHOOK_URL = `${
  process.env.NEXT_PUBLIC_APP_URL ?? "https://forgee.app"
}/api/webhook/twilio`;

const DEFAULT_QUESTIONS: Record<string, string[]> = {
  pool: ["What size is your pool?", "Is your pool above or in-ground?", "What city are you in?"],
  lawn: ["How large is your property?", "Weekly or bi-weekly service?", "What city are you in?"],
  cleaning: ["How many rooms?", "Residential or commercial?", "How often do you need cleaning?"],
  hvac: ["Is this for a repair or new installation?", "What city are you in?", "How old is your system?"],
  construction: ["What type of project?", "What is your timeline?", "Do you have a permit?"],
  other: ["What are you looking for?", "What city are you in?", "What is your budget?"],
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = { id: string; name: string; price: string; unit: string };

type FormData = {
  agentName: string;
  businessName: string;
  sector: string;
  servicesList: ServiceItem[];
  contractValue: string;
  qualificationQuestions: string[];
  disqualificationCriteria: string;
  tone: string;
  language: "FR" | "EN";
  bilingual: boolean;
  openDays: string[];
  openTime: string;
  closeTime: string;
  serviceArea: string;
  promotions: string;
  neverSay: string;
  escalationCriteria: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  phone: string;
};

function newService(): ServiceItem {
  return { id: Math.random().toString(36).slice(2), name: "", price: "", unit: "fixed" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [deployIndex, setDeployIndex] = useState(-1);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const [form, setForm] = useState<FormData>({
    agentName: "",
    businessName: "",
    sector: "",
    servicesList: [newService()],
    contractValue: "",
    qualificationQuestions: ["What are you looking for?", "What city are you in?", "What is your budget?"],
    disqualificationCriteria: "",
    tone: "",
    language: "EN",
    bilingual: false,
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    openTime: "09:00",
    closeTime: "18:00",
    serviceArea: "",
    promotions: "",
    neverSay: "",
    escalationCriteria: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    phone: "",
  });

  // Auto-populate qualification questions when sector changes
  useEffect(() => {
    if (!form.sector) return;
    const qs = DEFAULT_QUESTIONS[form.sector] ?? DEFAULT_QUESTIONS.other;
    setForm((prev) => ({ ...prev, qualificationQuestions: qs }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sector]);

  // Step 7: deploy animation + API call
  useEffect(() => {
    if (step !== 7) return;

    setDeployIndex(-1);
    setError(null);

    const labels = [
      "Saving your business profile...",
      "Generating agent personality...",
      "Loading your services and pricing...",
      "Calibrating qualification questions...",
      form.agentName ? `Your agent ${form.agentName} is ready.` : "Your agent is ready.",
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];

    labels.forEach((_, i) => {
      timers.push(setTimeout(() => setDeployIndex(i), 400 + i * 600));
    });

    const totalDuration = 400 + labels.length * 600 + 400;

    timers.push(
      setTimeout(async () => {
        const filteredServices = form.servicesList.filter((s) => s.name.trim());
        const payload = {
          agent_name: form.agentName,
          business_name: form.businessName,
          sector: form.sector,
          services_list: filteredServices.map(({ name, price, unit }) => ({ name, price, unit })),
          services: filteredServices.map((s) => `${s.name} (${s.price} ${s.unit})`).join(", "),
          contract_value: form.contractValue || null,
          qualification_questions: form.qualificationQuestions.filter((q) => q.trim()),
          disqualification_criteria: form.disqualificationCriteria || null,
          tone: form.tone || "professional",
          language: form.language,
          bilingual: form.bilingual,
          business_hours: {
            openTime: form.openTime,
            closeTime: form.closeTime,
            days: form.openDays,
          },
          service_area: form.serviceArea || null,
          promotions: form.promotions || null,
          never_say: form.neverSay || null,
          escalation_criteria: form.escalationCriteria || null,
          twilio_account_sid: form.twilioAccountSid || null,
          twilio_auth_token: form.twilioAuthToken || null,
          phone: form.phone || null,
        };

        try {
          const res = await fetch("/api/agent/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            router.push("/dashboard");
          } else {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            setError(data.error ?? "Failed to create agent. Please try again.");
          }
        } catch {
          setError("Network error. Please try again.");
        }
      }, totalDuration)
    );

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function canProceed(): boolean {
    switch (step) {
      case 1: return !!form.sector;
      case 2: return form.businessName.trim().length >= 2 && form.agentName.trim().length >= 2;
      case 3: return form.servicesList.some((s) => s.name.trim());
      case 4: return !!form.tone && form.openDays.length > 0;
      case 5: return form.qualificationQuestions.some((q) => q.trim());
      case 6: return true;
      default: return true;
    }
  }

  const deployLabels = [
    "Saving your business profile...",
    "Generating agent personality...",
    "Loading your services and pricing...",
    "Calibrating qualification questions...",
    form.agentName ? `Your agent ${form.agentName} is ready.` : "Your agent is ready.",
  ];

  function copyWebhook() {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    });
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <a
          href="/dashboard"
          className="text-sm text-white/40 transition-colors hover:text-white/70"
        >
          ← Dashboard
        </a>
        {step < TOTAL_STEPS && (
          <span className="text-xs text-white/30">
            Step {step} of {TOTAL_STEPS - 1}
          </span>
        )}
      </header>

      {/* Main */}
      <main className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* ── Step 1: Sector ── */}
          {step === 1 && (
            <div>
              <h1 className="mb-2 text-2xl font-semibold tracking-tight">
                What type of business is this agent for?
              </h1>
              <p className="mb-8 text-sm text-white/40">
                Choose the sector that best fits your new agent.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SECTORS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sector: s.id }))}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                      form.sector === s.id
                        ? "border-white/40 bg-white/[0.08]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Identity ── */}
          {step === 2 && (
            <div>
              <h1 className="mb-2 text-2xl font-semibold tracking-tight">
                Tell us about this business.
              </h1>
              <p className="mb-8 text-sm text-white/40">
                Your agent will introduce itself with these details.
              </p>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Business name <span className="text-white/30">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                    placeholder="e.g. Pool Pro Montreal"
                    className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Agent name <span className="text-white/30">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.agentName}
                    onChange={(e) => setForm((f) => ({ ...f, agentName: e.target.value }))}
                    placeholder="e.g. Max"
                    className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                  <p className="mt-1 text-xs text-white/30">
                    The first name your agent uses when responding to clients.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Average contract value
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONTRACT_VALUES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, contractValue: v }))}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          form.contractValue === v
                            ? "border-white/40 bg-white/[0.10] text-white"
                            : "border-white/[0.08] text-white/40 hover:border-white/20"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Services ── */}
          {step === 3 && (
            <div>
              <h1 className="mb-2 text-2xl font-semibold tracking-tight">
                What services do you offer?
              </h1>
              <p className="mb-8 text-sm text-white/40">
                Your agent will quote these prices during conversations.
              </p>
              <div className="flex flex-col gap-3">
                {form.servicesList.map((svc, i) => (
                  <div key={svc.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={svc.name}
                      onChange={(e) => {
                        const list = [...form.servicesList];
                        list[i] = { ...list[i], name: e.target.value };
                        setForm((f) => ({ ...f, servicesList: list }));
                      }}
                      placeholder={`Service ${i + 1}`}
                      className="h-9 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <input
                      type="text"
                      value={svc.price}
                      onChange={(e) => {
                        const list = [...form.servicesList];
                        list[i] = { ...list[i], price: e.target.value };
                        setForm((f) => ({ ...f, servicesList: list }));
                      }}
                      placeholder="Price"
                      className="h-9 w-24 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <select
                      value={svc.unit}
                      onChange={(e) => {
                        const list = [...form.servicesList];
                        list[i] = { ...list[i], unit: e.target.value };
                        setForm((f) => ({ ...f, servicesList: list }));
                      }}
                      className="h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-2 text-sm text-white/60 outline-none focus:border-white/25 transition-colors"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    {form.servicesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            servicesList: f.servicesList.filter((_, j) => j !== i),
                          }))
                        }
                        className="text-white/25 transition-colors hover:text-white/60"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {form.servicesList.length < 10 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        servicesList: [...f.servicesList, newService()],
                      }))
                    }
                    className="mt-1 self-start text-xs text-white/35 transition-colors hover:text-white/60"
                  >
                    + Add service
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Personality ── */}
          {step === 4 && (
            <div>
              <h1 className="mb-2 text-2xl font-semibold tracking-tight">
                Define your agent's personality.
              </h1>
              <p className="mb-8 text-sm text-white/40">
                This sets the tone for every conversation.
              </p>
              <div className="flex flex-col gap-7">
                {/* Tone */}
                <div>
                  <p className="mb-3 text-xs font-medium text-white/50">Tone</p>
                  <div className="grid grid-cols-3 gap-3">
                    {TONES.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, tone: tone.id }))}
                        className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors ${
                          form.tone === tone.id
                            ? "border-white/40 bg-white/[0.08]"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <span className="text-xl">{tone.emoji}</span>
                        <span className="text-xs font-semibold">{tone.label}</span>
                        <span className="text-[11px] text-white/35">{tone.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="mb-3 text-xs font-medium text-white/50">Language</p>
                  <div className="flex gap-2">
                    {(["EN", "FR"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, language: lang }))}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          form.language === lang
                            ? "border-white/40 bg-white/[0.10] text-white"
                            : "border-white/[0.08] text-white/40 hover:border-white/20"
                        }`}
                      >
                        {lang === "EN" ? "English" : "French"}
                      </button>
                    ))}
                    <label className="ml-4 flex cursor-pointer items-center gap-2 text-xs text-white/40">
                      <input
                        type="checkbox"
                        checked={form.bilingual}
                        onChange={(e) => setForm((f) => ({ ...f, bilingual: e.target.checked }))}
                        className="h-3.5 w-3.5 accent-white"
                      />
                      Bilingual (responds in client's language)
                    </label>
                  </div>
                </div>

                {/* Business hours */}
                <div>
                  <p className="mb-3 text-xs font-medium text-white/50">Business hours</p>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            openDays: f.openDays.includes(day)
                              ? f.openDays.filter((d) => d !== day)
                              : [...f.openDays, day],
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          form.openDays.includes(day)
                            ? "border-white/40 bg-white/[0.10] text-white"
                            : "border-white/[0.08] text-white/35 hover:border-white/20"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={form.openTime}
                      onChange={(e) => setForm((f) => ({ ...f, openTime: e.target.value }))}
                      className="h-9 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/25 transition-colors"
                    />
                    <span className="text-xs text-white/30">to</span>
                    <input
                      type="time"
                      value={form.closeTime}
                      onChange={(e) => setForm((f) => ({ ...f, closeTime: e.target.value }))}
                      className="h-9 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Qualification ── */}
          {step === 5 && (
            <div>
              <h1 className="mb-2 text-2xl font-semibold tracking-tight">
                How should your agent qualify leads?
              </h1>
              <p className="mb-8 text-sm text-white/40">
                Your agent will ask these questions in order to qualify incoming leads.
              </p>
              <div className="flex flex-col gap-6">
                <div>
                  <p className="mb-2 text-xs font-medium text-white/50">
                    Qualification questions
                  </p>
                  {form.qualificationQuestions.map((q, i) => (
                    <div key={i} className="mb-2 flex items-center gap-2">
                      <span className="w-5 shrink-0 text-xs text-white/25">{i + 1}.</span>
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => {
                          const qs = [...form.qualificationQuestions];
                          qs[i] = e.target.value;
                          setForm((f) => ({ ...f, qualificationQuestions: qs }));
                        }}
                        placeholder={`Question ${i + 1}`}
                        className="h-9 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                      />
                      {form.qualificationQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              qualificationQuestions: f.qualificationQuestions.filter((_, j) => j !== i),
                            }))
                          }
                          className="text-white/25 transition-colors hover:text-white/60"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {form.qualificationQuestions.length < 8 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          qualificationQuestions: [...f.qualificationQuestions, ""],
                        }))
                      }
                      className="text-xs text-white/30 transition-colors hover:text-white/60"
                    >
                      + Add question
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Disqualification criteria <span className="text-white/25">(optional)</span>
                  </label>
                  <textarea
                    value={form.disqualificationCriteria}
                    onChange={(e) => setForm((f) => ({ ...f, disqualificationCriteria: e.target.value }))}
                    placeholder="e.g. Outside of service area, budget under $200..."
                    rows={2}
                    className="w-full resize-none rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Service area <span className="text-white/25">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.serviceArea}
                      onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))}
                      placeholder="e.g. Greater Montreal"
                      className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Never say <span className="text-white/25">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.neverSay}
                      onChange={(e) => setForm((f) => ({ ...f, neverSay: e.target.value }))}
                      placeholder="e.g. competitor names..."
                      className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Twilio ── */}
          {step === 6 && (
            <div>
              <h1 className="mb-2 text-2xl font-semibold tracking-tight">
                Connect a phone number. <span className="text-white/30">(Optional)</span>
              </h1>
              <p className="mb-8 text-sm text-white/40">
                Link a Twilio number so this agent can send and receive SMS. You can also configure this later in Settings.
              </p>

              <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-2 text-xs font-medium text-white/50">
                  Webhook URL — paste this in your Twilio number settings
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md bg-white/[0.04] px-3 py-2 font-mono text-xs text-white/60">
                    {WEBHOOK_URL}
                  </code>
                  <button
                    type="button"
                    onClick={copyWebhook}
                    className="shrink-0 rounded-md border border-white/10 px-3 py-2 text-xs text-white/50 transition-colors hover:text-white/80"
                  >
                    {urlCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Account SID
                  </label>
                  <input
                    type="text"
                    value={form.twilioAccountSid}
                    onChange={(e) => setForm((f) => ({ ...f, twilioAccountSid: e.target.value }))}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Auth token
                  </label>
                  <div className="relative">
                    <input
                      type={showTwilioToken ? "text" : "password"}
                      value={form.twilioAuthToken}
                      onChange={(e) => setForm((f) => ({ ...f, twilioAuthToken: e.target.value }))}
                      placeholder="Your auth token"
                      className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 pr-10 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTwilioToken((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                    >
                      {showTwilioToken ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+15141234567"
                    className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 7: Deploy animation ── */}
          {step === 7 && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Forgee is building your agent.
                </h1>
              </div>
              <div className="flex w-full max-w-sm flex-col gap-4">
                {deployLabels.map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                    style={{
                      opacity: deployIndex >= i ? 1 : 0,
                      transform: deployIndex >= i ? "translateY(0)" : "translateY(8px)",
                      transition: "opacity 300ms ease-out, transform 300ms ease-out",
                    }}
                  >
                    <span
                      className={`text-base ${
                        i === deployLabels.length - 1 ? "text-white" : "text-emerald-400"
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`text-sm ${
                        i === deployLabels.length - 1
                          ? "font-semibold text-white"
                          : "text-white/55"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              {error && (
                <p className="mt-6 rounded-md border border-red-500/20 bg-red-500/[0.08] px-4 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      {step < 7 && (
        <footer className="sticky bottom-0 border-t border-white/[0.06] bg-[#0a0a0a] px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="rounded-lg bg-white px-6 py-2 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-35"
            >
              {step === 6 ? "Create agent →" : "Next →"}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
