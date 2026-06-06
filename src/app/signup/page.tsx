"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";

declare global {
  interface Window {
    fbq: any;
  }
}

type OnboardingData = {
  agentName: string;
  businessName: string;
  sector: string;
  servicesList: { id: string; name: string; price: string; unit: string }[];
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

async function saveAgentData(data: OnboardingData): Promise<boolean> {
  const filteredServices = data.servicesList.filter((s) => s.name.trim());
  const payload = {
    agent_name: data.agentName,
    business_name: data.businessName,
    sector: data.sector,
    services_list: filteredServices.map(({ name, price, unit }) => ({ name, price, unit })),
    services: filteredServices.map((s) => `${s.name} (${s.price} ${s.unit})`).join(", "),
    contract_value: data.contractValue,
    qualification_questions: data.qualificationQuestions.filter((q) => q.trim()),
    disqualification_criteria: data.disqualificationCriteria || null,
    tone: data.tone,
    language: data.language,
    bilingual: data.bilingual,
    business_hours: { openTime: data.openTime, closeTime: data.closeTime, days: data.openDays },
    service_area: data.serviceArea || null,
    promotions: data.promotions || null,
    never_say: data.neverSay || null,
    escalation_criteria: data.escalationCriteria || null,
    twilio_account_sid: (data as OnboardingData & { twilioAccountSid?: string }).twilioAccountSid || null,
    twilio_auth_token: (data as OnboardingData & { twilioAuthToken?: string }).twilioAuthToken || null,
    phone: data.phone || null,
  };

  try {
    const res = await fetch("/api/agent/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const SECTOR_LABELS: Record<string, { en: string; fr: string }> = {
  pool: { en: "Pool & Spa", fr: "Piscine & Spa" },
  lawn: { en: "Lawn & Landscaping", fr: "Gazon & Aménagement" },
  cleaning: { en: "Cleaning", fr: "Nettoyage" },
  hvac: { en: "HVAC", fr: "CVC" },
  construction: { en: "Construction & Renovation", fr: "Construction & Rénovation" },
  other: { en: "Other", fr: "Autre" },
};

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackLead, setTrackLead] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [lang, setLang] = useState<"en" | "fr">("en");

  useEffect(() => {
    const raw = localStorage.getItem("forgee_onboarding_data");
    if (raw) {
      try {
        const data = JSON.parse(raw) as OnboardingData;
        setOnboardingData(data);
        posthog.capture("signup_after_onboarding_viewed", {
          agent_name: data.agentName,
          sector: data.sector,
        });
      } catch {
        // ignore malformed data
      }
    }

    // Pre-fill email if captured elsewhere (exit intent, etc.)
    const savedEmail = localStorage.getItem("forgee_lead_email");
    if (savedEmail) setEmail(savedEmail);

    const storedLang = localStorage.getItem("forgee_lang") as "en" | "fr" | null;
    if (storedLang === "en" || storedLang === "fr") setLang(storedLang);
  }, []);

  useEffect(() => {
    if (!trackLead) return;
    window.fbq?.("track", "Lead");
  }, [trackLead]);

  async function handleGoogleSignIn() {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/onboarding/plan` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Confirm session was created (email confirmation may be required)
    const { data: { session } } = await supabase.auth.getSession();

    setTrackLead(true);

    if (!session) {
      // Email confirmation required — show message instead of redirecting
      setError("Check your inbox to confirm your email, then sign in.");
      setLoading(false);
      return;
    }

    // Account created and session confirmed
    window.fbq?.("track", "CompleteRegistration");
    posthog.identify(authData.user!.id, { email });
    posthog.capture("user_signed_up");

    if (onboardingData) {
      await saveAgentData(onboardingData);
      localStorage.removeItem("forgee_onboarding_data");
      router.push("/onboarding/plan");
    } else {
      router.push("/onboarding");
    }
  }

  const inputCls =
    "h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors";

  // ── Post-onboarding save flow ──────────────────────────────────────────────
  if (onboardingData) {
    const serviceCount = onboardingData.servicesList.filter((s) => s.name.trim()).length;
    const sectorLabel = SECTOR_LABELS[onboardingData.sector]?.[lang] ?? onboardingData.sector;

    const recapItems = [
      { label: t("recapAgent"), value: onboardingData.agentName },
      { label: t("recapBusiness"), value: onboardingData.businessName },
      { label: t("recapSector"), value: sectorLabel },
      {
        label: serviceCount === 1
          ? t("recapServicesCount", { count: serviceCount })
          : t("recapServicesCountPlural", { count: serviceCount }),
        value: null,
      },
      { label: t("recapTone"), value: onboardingData.tone },
      { label: t("recapLanguage"), value: onboardingData.language },
    ].filter(({ value, label }) => value || label);

    return (
      <div className="flex min-h-screen flex-col items-center bg-[#0a0a0a] px-4 py-12">
        <div className="mb-10">
          <img src="/logo.svg" alt="Forgee" height="28" />
        </div>

        <div className="w-full max-w-lg">
          {/* Celebration heading */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {t("saveHeading", { name: onboardingData.agentName })} 🎉
            </h1>
            <p className="text-base text-white/50">{t("saveSubtitle")}</p>
          </div>

          {/* Recap card */}
          <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">
              {t("recapTitle")}
            </p>
            <div className="flex flex-col gap-2.5">
              {recapItems.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400">✓</span>
                  <span className="text-sm text-white/70">
                    {label}
                    {value ? <span className="font-medium text-white">: {value}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-white/40">{t("progressLabel")}</span>
              <span className="text-xs font-semibold text-white/60">90%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[90%] rounded-full bg-emerald-400 transition-all duration-700" />
            </div>
          </div>

          {/* Explanation */}
          <p className="mb-6 text-center text-sm leading-relaxed text-white/40">
            {t("saveExplanation")}
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {t("continueWithGoogle")}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs text-white/25">{t("orDivider")}</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-white/50">
                {t("emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-white/50">
                {t("passwordLabel")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className={inputCls}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/[0.08] px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-12 rounded-lg bg-white text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? t("savingButton") : t("saveButton")}
            </button>
          </form>

          {/* Privacy note */}
          <p className="mt-4 text-center text-xs text-white/25">{t("privacyNote")}</p>

          {/* Sign in link */}
          <p className="mt-5 text-center text-xs text-white/30">
            {t("haveAccount")}{" "}
            <a href="/login" className="text-white/60 underline underline-offset-4 hover:text-white">
              {t("signIn")}
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Standard signup (no onboarding data) ──────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8">
          <img src="/logo.svg" alt="Forgee" height="28" />
        </div>

        <h1 className="mb-2 text-xl font-semibold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="mb-8 text-sm text-white/40">
          {t("haveAccount")}{" "}
          <a href="/login" className="text-white/70 underline underline-offset-4 hover:text-white">
            {t("signIn")}
          </a>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-white/50">
              {t("emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 focus:ring-0 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-white/50">
              {t("passwordLabel")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 focus:ring-0 transition-colors"
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-500/20 bg-red-500/[0.08] px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-10 rounded-md bg-white text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("creatingAccount") : t("createAccount")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/20">
          {t("terms")}
        </p>
      </div>
    </div>
  );
}
