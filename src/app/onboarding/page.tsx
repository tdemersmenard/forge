"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

declare global {
  interface Window {
    fbq: any;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTORS = [
  { id: "pool", emoji: "🏊" },
  { id: "lawn", emoji: "🌿" },
  { id: "cleaning", emoji: "🏠" },
  { id: "hvac", emoji: "🔧" },
  { id: "construction", emoji: "🔨" },
  { id: "other", emoji: "✨" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TONES = [
  { id: "professional", emoji: "🎯" },
  { id: "friendly", emoji: "😊" },
  { id: "direct", emoji: "⚡" },
];

const CONTRACT_VALUES = [
  "Under $500",
  "$500–$2,000",
  "$2,000–$5,000",
  "$5,000+",
];

const UNITS = ["fixed", "per visit", "per sqft", "custom"];

const TOTAL_STEPS = 7;

const WEBHOOK_URL = `${
  process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-zeta-silk.vercel.app"
}/api/webhook/twilio`;

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
  language: string;
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
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    price: "",
    unit: "fixed",
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const [step, setStep] = useState(1);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployIndex, setDeployIndex] = useState(-1);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [twilioStatus, setTwilioStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [twilioError, setTwilioError] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  const [form, setForm] = useState<FormData>({
    agentName: "",
    businessName: "",
    sector: "",
    servicesList: [newService()],
    contractValue: "",
    qualificationQuestions: [
      "What are you looking for?",
      "What city are you in?",
      "What is your budget?",
    ],
    disqualificationCriteria: "",
    tone: "",
    language: "FR",
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

  // Track CompleteRegistration on first load
  useEffect(() => {
    window.fbq?.("track", "CompleteRegistration");
  }, []);

  // Persist form to localStorage as user progresses
  useEffect(() => {
    localStorage.setItem("forgee_onboarding_data", JSON.stringify(form));
  }, [form]);

  // Step entry animation
  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(timer);
  }, [step]);

  // Auto-populate qualification questions when sector changes
  useEffect(() => {
    if (!form.sector) return;
    const defaultQs = t.raw("defaultQuestions") as Record<string, string[]>;
    const qs = defaultQs[form.sector] ?? defaultQs.other ?? [];
    setForm((prev) => ({ ...prev, qualificationQuestions: qs }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sector]);

  // Deploy animation + save (step 7)
  useEffect(() => {
    if (step !== 7) return;

    setDeployIndex(-1);
    setError(null);

    const labels = [
      t("step7.profile"),
      t("step7.personality"),
      t("step7.services"),
      t("step7.questions"),
      form.agentName
        ? t("step7.readyNamed", { name: form.agentName })
        : t("step7.ready"),
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];

    labels.forEach((_, i) => {
      timers.push(setTimeout(() => setDeployIndex(i), 400 + i * 600));
    });

    const totalDuration = 400 + labels.length * 600 + 700;
    timers.push(
      setTimeout(() => {
        router.push("/signup");
      }, totalDuration)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    if (step === 1)
      return (
        form.agentName.trim() !== "" &&
        form.businessName.trim() !== "" &&
        form.sector !== ""
      );
    if (step === 2)
      return (
        form.servicesList.some((s) => s.name.trim() !== "") &&
        form.contractValue !== ""
      );
    if (step === 3)
      return form.qualificationQuestions.some((q) => q.trim() !== "");
    if (step === 4) return form.tone !== "";
    return true;
  }

  async function testTwilio() {
    setTwilioStatus("loading");
    setTwilioError(null);
    try {
      const res = await fetch("/api/twilio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilio_account_sid: form.twilioAccountSid,
          twilio_auth_token: form.twilioAuthToken,
          phone: form.phone,
        }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        setTwilioStatus("success");
      } else {
        setTwilioStatus("error");
        setTwilioError(data.error ?? "Invalid credentials.");
      }
    } catch {
      setTwilioStatus("error");
      setTwilioError("Network error — try again.");
    }
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }

  function addService() {
    if (form.servicesList.length >= 10) return;
    set("servicesList", [...form.servicesList, newService()]);
  }

  function removeService(id: string) {
    if (form.servicesList.length <= 1) return;
    set(
      "servicesList",
      form.servicesList.filter((s) => s.id !== id)
    );
  }

  function updateService(
    id: string,
    field: keyof Omit<ServiceItem, "id">,
    value: string
  ) {
    set(
      "servicesList",
      form.servicesList.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function addQuestion() {
    if (form.qualificationQuestions.length >= 8) return;
    set("qualificationQuestions", [...form.qualificationQuestions, ""]);
  }

  function removeQuestion(i: number) {
    const qs = [...form.qualificationQuestions];
    qs.splice(i, 1);
    set("qualificationQuestions", qs);
  }

  function updateQuestion(i: number, value: string) {
    const qs = [...form.qualificationQuestions];
    qs[i] = value;
    set("qualificationQuestions", qs);
  }

  function toggleDay(day: string) {
    const days = form.openDays.includes(day)
      ? form.openDays.filter((d) => d !== day)
      : [...form.openDays, day];
    set("openDays", days);
  }

  const deployLabels = [
    t("step7.profile"),
    t("step7.personality"),
    t("step7.services"),
    t("step7.questions"),
    form.agentName
      ? t("step7.readyNamed", { name: form.agentName })
      : t("step7.ready"),
  ];

  const inputCls =
    "h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors";
  const textareaCls =
    "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors resize-none";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2h4v4H2V2zM8 2h4v4H8V2zM2 8h4v4H2V8zM9 9l2 2-2 2"
                stroke="#0a0a0a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">Forge</span>
        </div>
        {step < TOTAL_STEPS && (
          <span className="text-xs text-white/35">
            {t("stepOf", { step, total: TOTAL_STEPS })}
          </span>
        )}
      </header>

      {/* ── Progress bar ── */}
      <div className="h-0.5 bg-white/[0.05]">
        <div
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* ── Step content ── */}
      <main
        className="flex-1 flex flex-col items-center justify-center px-4 py-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 300ms ease-out, transform 300ms ease-out",
        }}
      >
        <div className="w-full max-w-2xl">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 1: Agent Identity
          ════════════════════════════════════════ */}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {t("step1.title")}
                </h1>
                <p className="mt-2 text-base text-white/50">
                  {t("step1.subtitle")}
                </p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step1.agentNameLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.agentName}
                    onChange={(e) => set("agentName", e.target.value)}
                    placeholder={t("step1.agentNamePlaceholder")}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step1.businessNameLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                    placeholder={t("step1.businessNamePlaceholder")}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-white/50">
                    {t("step1.sectorLabel")}
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {SECTORS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => set("sector", s.id)}
                        className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                          form.sector === s.id
                            ? "border-white bg-white/[0.08] text-white"
                            : "border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        <span className="text-xl">{s.emoji}</span>
                        <span className="text-xs font-medium leading-snug">
                          {t(`step1.sectors.${s.id}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 2: Services & Pricing
          ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {t("step2.title")}
                </h1>
                <p className="mt-2 text-base text-white/50">
                  {t("step2.subtitle")}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {form.servicesList.map((svc) => (
                  <div key={svc.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={svc.name}
                      onChange={(e) =>
                        updateService(svc.id, "name", e.target.value)
                      }
                      placeholder={t("step2.servicePlaceholder")}
                      className="h-10 flex-[3] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <div className="flex items-center">
                      <span className="mr-1 text-white/30 text-sm">$</span>
                      <input
                        type="number"
                        value={svc.price}
                        onChange={(e) =>
                          updateService(svc.id, "price", e.target.value)
                        }
                        placeholder="1800"
                        className="h-10 w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                      />
                    </div>
                    <select
                      value={svc.unit}
                      onChange={(e) =>
                        updateService(svc.id, "unit", e.target.value)
                      }
                      className="h-10 rounded-lg border border-white/10 bg-[#0a0a0a] px-2 text-xs text-white/60 outline-none focus:border-white/25 transition-colors"
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
                      disabled={form.servicesList.length <= 1}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-white/25 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-25"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M2.5 4.5h8M5 4.5V3h3v1.5M5.5 6.5v3M7.5 6.5v3M3 4.5l.5 6.5h6L10 4.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {form.servicesList.length < 10 && (
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
                    {t("step2.addService")}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-white/50">
                  {t("step2.contractValueLabel")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_VALUES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set("contractValue", v)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                        form.contractValue === v
                          ? "border-white bg-white/[0.08] text-white"
                          : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 3: Lead Qualification
          ════════════════════════════════════════ */}
          {step === 3 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {t("step3.title")}
                </h1>
                <p className="mt-2 text-base text-white/50">
                  {t("step3.subtitle")}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {form.qualificationQuestions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-center text-xs text-white/20">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => updateQuestion(i, e.target.value)}
                      placeholder={t("step3.questionPlaceholder")}
                      className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    {form.qualificationQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-white/25 transition-colors hover:border-red-500/30 hover:text-red-400"
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
                    )}
                  </div>
                ))}
                {form.qualificationQuestions.length < 8 && (
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
                    {t("step3.addQuestion")}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  {t("step3.disqualLabel")}
                </label>
                <textarea
                  value={form.disqualificationCriteria}
                  onChange={(e) =>
                    set("disqualificationCriteria", e.target.value)
                  }
                  rows={3}
                  placeholder={t("step3.disqualPlaceholder")}
                  className={textareaCls}
                />
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 4: Agent Personality
          ════════════════════════════════════════ */}
          {step === 4 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {t("step4.title")}
                </h1>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => set("tone", tone.id)}
                    className={`rounded-xl border p-5 text-left transition-colors ${
                      form.tone === tone.id
                        ? "border-white bg-white/[0.06]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="mb-2 text-2xl">{tone.emoji}</div>
                    <div className="mb-1 text-sm font-semibold text-white">
                      {t(`step4.${tone.id}.label`)}
                    </div>
                    <div className="mb-3 text-xs text-white/40">
                      {t(`step4.${tone.id}.desc`)}
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 text-xs italic leading-relaxed text-white/45">
                      &ldquo;{t(`step4.${tone.id}.example`)}&rdquo;
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/50">
                    {t("step4.languageLabel")}
                  </label>
                  <div className="flex gap-2">
                    {["FR", "EN"].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => set("language", lang)}
                        className={`rounded-full border px-5 py-1.5 text-sm transition-colors ${
                          form.language === lang
                            ? "border-white bg-white/[0.06] text-white"
                            : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        {lang === "FR" ? "🇫🇷 Français" : "🇬🇧 English"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.bilingual}
                    onChange={(e) => set("bilingual", e.target.checked)}
                    className="h-4 w-4 rounded accent-white"
                  />
                  <span className="text-sm text-white/55">
                    {t("step4.bilingualLabel")}
                  </span>
                </label>
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/50">
                    {t("step4.hoursLabel")}
                  </label>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/35">{t("step4.openLabel")}</span>
                      <input
                        type="time"
                        value={form.openTime}
                        onChange={(e) => set("openTime", e.target.value)}
                        className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none focus:border-white/25 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/35">{t("step4.closesLabel")}</span>
                      <input
                        type="time"
                        value={form.closeTime}
                        onChange={(e) => set("closeTime", e.target.value)}
                        className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none focus:border-white/25 transition-colors"
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
                          form.openDays.includes(d)
                            ? "border-white bg-white/[0.08] text-white"
                            : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/60"
                        }`}
                      >
                        {t(`step4.days.${d}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 5: Special Instructions
          ════════════════════════════════════════ */}
          {step === 5 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {t("step5.title")}
                </h1>
                <p className="mt-2 text-base text-white/50">
                  {t("step5.subtitle")}
                </p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step5.serviceAreaLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.serviceArea}
                    onChange={(e) => set("serviceArea", e.target.value)}
                    placeholder={t("step5.serviceAreaPlaceholder")}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step5.promotionsLabel")}
                  </label>
                  <textarea
                    value={form.promotions}
                    onChange={(e) => set("promotions", e.target.value)}
                    rows={2}
                    placeholder={t("step5.promotionsPlaceholder")}
                    className={textareaCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step5.neverSayLabel")}
                  </label>
                  <textarea
                    value={form.neverSay}
                    onChange={(e) => set("neverSay", e.target.value)}
                    rows={2}
                    placeholder={t("step5.neverSayPlaceholder")}
                    className={textareaCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step5.escalationLabel")}
                  </label>
                  <textarea
                    value={form.escalationCriteria}
                    onChange={(e) => set("escalationCriteria", e.target.value)}
                    rows={2}
                    placeholder={t("step5.escalationPlaceholder")}
                    className={textareaCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 6: Connect Phone Number
          ════════════════════════════════════════ */}
          {step === 6 && (
            <div className="flex flex-col gap-7">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {t("step6.title")}
                </h1>
                <p className="mt-2 text-base text-white/50">
                  {t("step6.subtitle")}
                </p>
              </div>

              {/* Twilio callout */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="mb-2 text-sm font-semibold text-white">
                  What is Twilio?
                </p>
                <p className="text-sm leading-relaxed text-white/50">
                  Twilio is a phone service that gives your agent its own SMS
                  number. Your clients will text this number and your agent will
                  respond automatically.
                </p>
                <p className="mt-1.5 text-xs text-white/30">
                  Cost: ~$1.15/month for a local number. Setup takes about 3
                  minutes.
                </p>
              </div>

              {/* Step-by-step instructions */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-white/30">
                  Setup instructions
                </p>
                {[
                  "Go to twilio.com and create a free account",
                  "Buy a local phone number (~$1.15/mo)",
                  "In your Twilio console, go to your number settings",
                  null, // webhook URL row (special)
                  "Copy your credentials below and paste them here",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] font-semibold text-white/35">
                      {i + 1}
                    </span>
                    {text !== null ? (
                      <p className="pt-0.5 text-sm text-white/45">{text}</p>
                    ) : (
                      <div className="flex flex-1 flex-wrap items-center gap-2 pt-0.5">
                        <p className="text-sm text-white/45">
                          {t("step6.webhookInstructions")}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <code className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-white/60">
                            {WEBHOOK_URL}
                          </code>
                          <button
                            type="button"
                            onClick={copyWebhookUrl}
                            className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/40 transition-colors hover:text-white/70"
                          >
                            {urlCopied ? t("step6.copied") : t("step6.copy")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Credentials */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step6.accountSidLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.twilioAccountSid}
                    onChange={(e) => {
                      set("twilioAccountSid", e.target.value);
                      setTwilioStatus("idle");
                    }}
                    placeholder={t("step6.accountSidPlaceholder")}
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step6.authTokenLabel")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showTwilioToken ? "text" : "password"}
                      value={form.twilioAuthToken}
                      onChange={(e) => {
                        set("twilioAuthToken", e.target.value);
                        setTwilioStatus("idle");
                      }}
                      placeholder="Your auth token"
                      className="h-11 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTwilioToken((v) => !v)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/35 transition-colors hover:text-white/70"
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
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {t("step6.phoneLabel")}
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => {
                      set("phone", e.target.value);
                      setTwilioStatus("idle");
                    }}
                    placeholder={t("step6.phonePlaceholder")}
                    className={inputCls}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={testTwilio}
                    disabled={
                      twilioStatus === "loading" ||
                      !form.twilioAccountSid ||
                      !form.twilioAuthToken ||
                      !form.phone
                    }
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
                  >
                    {twilioStatus === "loading" ? t("step6.testing") : t("step6.testConnection")}
                  </button>
                  {twilioStatus === "success" && (
                    <span className="text-sm text-emerald-400">
                      ✓ {t("step6.connected")}
                    </span>
                  )}
                  {twilioStatus === "error" && (
                    <span className="text-sm text-red-400">
                      ✗ {twilioError}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(7)}
                className="w-fit text-xs text-white/25 underline underline-offset-4 transition-colors hover:text-white/50"
              >
                {t("skip")}
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 7: Building (automated)
          ════════════════════════════════════════ */}
          {step === 7 && (
            <div className="flex flex-col items-center gap-10 py-8">
              <div className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {t("step7.title")}
                </h1>
              </div>
              <div className="flex w-full max-w-sm flex-col gap-4">
                {deployLabels.map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                    style={{
                      opacity: deployIndex >= i ? 1 : 0,
                      transform:
                        deployIndex >= i
                          ? "translateY(0)"
                          : "translateY(8px)",
                      transition: "opacity 300ms ease-out, transform 300ms ease-out",
                    }}
                  >
                    <span
                      className={`text-base ${
                        i === deployLabels.length - 1
                          ? "text-white"
                          : "text-emerald-400"
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
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          )}
        </div>
      </main>

      {/* ── Navigation ── */}
      {step < 7 && (
        <footer className="sticky bottom-0 border-t border-white/[0.06] bg-[#0a0a0a] px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white"
              >
                ← {t("back")}
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
              {step === 6 ? `${t("next")} →` : `${t("next")} →`}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
