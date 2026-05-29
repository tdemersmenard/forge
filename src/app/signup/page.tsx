"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

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

async function saveAgentData(userId: string, data: OnboardingData) {
  const supabase = createClient();
  const filteredServices = data.servicesList.filter((s) => s.name.trim());
  const payload = {
    user_id: userId,
    agent_name: data.agentName,
    business_name: data.businessName,
    sector: data.sector,
    services_list: filteredServices,
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
    twilio_account_sid: data.twilioAccountSid || null,
    twilio_auth_token: data.twilioAuthToken || null,
    phone: data.phone || null,
  };
  await supabase.from("agents").insert(payload);
}

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackLead, setTrackLead] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("forgee_onboarding_data");
    if (raw) {
      try {
        setOnboardingData(JSON.parse(raw) as OnboardingData);
      } catch {
        // ignore malformed data
      }
    }
  }, []);

  useEffect(() => {
    if (!trackLead) return;
    window.fbq?.("track", "Lead");
  }, [trackLead]);

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

    setTrackLead(true);

    if (onboardingData && authData.user) {
      try {
        await saveAgentData(authData.user.id, onboardingData);
      } catch {
        // non-fatal — user still lands on plan page
      }
      localStorage.removeItem("forgee_onboarding_data");
      router.push("/onboarding/plan");
    } else {
      router.push("/onboarding");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* Agent ready banner */}
        {onboardingData && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-400">
            <span>✓</span>
            <span>{t("agentReadyBanner")}</span>
          </div>
        )}

        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
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

        <p className="mt-6 text-xs text-white/20 text-center">
          {t("terms")}
        </p>
      </div>
    </div>
  );
}
