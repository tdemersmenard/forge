"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SECTORS = ["Piscines", "Pelouses", "Ménage", "HVAC", "Autre"];
const TONES = [
  {
    id: "Professionnel",
    label: "Professionnel",
    description: "Formel et fiable",
  },
  { id: "Amical", label: "Amical", description: "Chaleureux et approchable" },
  { id: "Direct", label: "Direct", description: "Court et efficace" },
];

type FormData = {
  businessName: string;
  sector: string;
  services: string;
  tone: string;
  language: string;
  openTime: string;
  closeTime: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  phone: string;
  facebookPageId: string;
  facebookAccessToken: string;
  facebookVerifyToken: string;
};

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<FormData>({
    businessName: "",
    sector: "",
    services: "",
    tone: "",
    language: "FR",
    openTime: "08:00",
    closeTime: "18:00",
    twilioAccountSid: "",
    twilioAuthToken: "",
    phone: "",
    facebookPageId: "",
    facebookAccessToken: "",
    facebookVerifyToken: "",
  });

  // Generate verify token client-side only (avoid hydration mismatch)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      facebookVerifyToken: crypto.randomUUID(),
    }));
  }, []);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed() {
    if (step === 1) return form.businessName.trim() !== "" && form.sector !== "";
    if (step === 2) return form.services.trim() !== "";
    if (step === 3) return form.tone !== "";
    if (step === 4) return form.language !== "";
    return true;
  }

  async function handleDeploy() {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: dbError } = await supabase.from("agents").insert({
      user_id: user.id,
      business_name: form.businessName,
      sector: form.sector,
      services: form.services,
      tone: form.tone,
      language: form.language,
      twilio_account_sid: form.twilioAccountSid || null,
      twilio_auth_token: form.twilioAuthToken || null,
      phone: form.phone || null,
      facebook_page_id: form.facebookPageId || null,
      facebook_access_token: form.facebookAccessToken || null,
      facebook_verify_token: form.facebookVerifyToken || null,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function copyVerifyToken() {
    if (!form.facebookVerifyToken) return;
    await navigator.clipboard.writeText(form.facebookVerifyToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-2">
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

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-white/40">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs text-white/40">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-7">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Tell us about your business
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  We'll use this to configure your agent's identity.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Business name
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="Acme Piscines Inc."
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Sector</label>
                <select
                  value={form.sector}
                  onChange={(e) => set("sector", e.target.value)}
                  className="h-10 rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-sm text-white outline-none focus:border-white/25 transition-colors"
                >
                  <option value="" disabled>
                    Select a sector
                  </option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Describe your services
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  What services do you offer? Your agent will use this to
                  answer questions.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Services description
                </label>
                <textarea
                  value={form.services}
                  onChange={(e) => set("services", e.target.value)}
                  rows={5}
                  placeholder="We install, maintain, and repair in-ground pools. We also offer weekly cleaning packages starting at $120/month…"
                  className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Choose a tone
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  How should your agent communicate with customers?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set("tone", t.id)}
                    className={`flex items-center justify-between rounded-lg border px-5 py-4 text-left transition-colors ${
                      form.tone === t.id
                        ? "border-white bg-white/[0.06]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{t.label}</p>
                      <p className="text-xs text-white/40">{t.description}</p>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border-2 transition-colors ${
                        form.tone === t.id
                          ? "border-white bg-white"
                          : "border-white/20"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Language &amp; hours
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  When is your business open, and in what language should your
                  agent communicate?
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Language</label>
                <div className="flex gap-3">
                  {["FR", "EN"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => set("language", lang)}
                      className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
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
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    Opens at
                  </label>
                  <input
                    type="time"
                    value={form.openTime}
                    onChange={(e) => set("openTime", e.target.value)}
                    className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    Closes at
                  </label>
                  <input
                    type="time"
                    value={form.closeTime}
                    onChange={(e) => set("closeTime", e.target.value)}
                    className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/25 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Connect your Twilio account
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  Your agent will send and receive SMS using your own Twilio
                  number and credentials.
                </p>
                <a
                  href="https://www.twilio.com/console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-white/30 underline underline-offset-2 hover:text-white/60 transition-colors"
                >
                  Find these at twilio.com/console
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8L8 2M8 2H4M8 2v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Account SID
                </label>
                <input
                  type="text"
                  value={form.twilioAccountSid}
                  onChange={(e) => set("twilioAccountSid", e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={form.twilioAuthToken}
                  onChange={(e) => set("twilioAuthToken", e.target.value)}
                  placeholder="Your Twilio Auth Token"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+15551234567"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
                <p className="text-xs text-white/30">
                  Format: +15551234567 — Optional, can be added later in Settings.
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
                  Summary
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Business", value: form.businessName },
                    { label: "Sector", value: form.sector },
                    { label: "Tone", value: form.tone },
                    { label: "Language", value: form.language },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-xs text-white/40">{label}</span>
                      <span className="text-xs font-medium text-white/80">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Connect Facebook Leads{" "}
                  <span className="text-sm font-normal text-white/40">(optional)</span>
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  Automatically capture and respond to leads from your Facebook
                  &amp; Instagram ads.
                </p>
                <p className="mt-2 text-xs text-white/30">
                  Skip this step if you don't run Facebook/Instagram ads.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Facebook Page ID
                </label>
                <input
                  type="text"
                  value={form.facebookPageId}
                  onChange={(e) => set("facebookPageId", e.target.value)}
                  placeholder="123456789012345"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Facebook Page Access Token
                </label>
                <input
                  type="password"
                  value={form.facebookAccessToken}
                  onChange={(e) => set("facebookAccessToken", e.target.value)}
                  placeholder="EAAxxxxxxxx…"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Verify Token
                  <span className="ml-1.5 text-white/25 font-normal">(auto-generated — copy this)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={form.facebookVerifyToken}
                    className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.02] px-3 font-mono text-xs text-white/50 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={copyVerifyToken}
                    className="flex h-10 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
                  >
                    {copied ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M8 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1" stroke="currentColor" strokeWidth="1.2"/>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/25">
                  You'll need this verify token when configuring your webhook in Meta for Developers.
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-2 text-xs font-medium text-white/40">Webhook setup</p>
                <p className="text-xs text-white/30 leading-relaxed">
                  In Meta for Developers → Your App → Webhooks, add callback URL:
                </p>
                <p className="mt-1 font-mono text-xs text-white/50">
                  {process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-zeta-silk.vercel.app"}/api/webhook/facebook
                </p>
                <p className="mt-2 text-xs text-white/30">
                  Subscribe to the <span className="text-white/50">leadgen</span> field on the Page object.
                </p>
              </div>

              {error && (
                <p className="rounded-md border border-red-500/20 bg-red-500/[0.08] px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              &larr; Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === 6 && (
              <button
                type="button"
                disabled={loading}
                onClick={handleDeploy}
                className="text-sm text-white/40 transition-colors hover:text-white/70 disabled:opacity-30"
              >
                Skip &rarr;
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                disabled={!canProceed()}
                onClick={() => setStep((s) => s + 1)}
                className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                Next &rarr;
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleDeploy}
                className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Deploying…" : "Deploy my agent"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
