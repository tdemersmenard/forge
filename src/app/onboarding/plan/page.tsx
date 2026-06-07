"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";

declare global {
  interface Window {
    fbq: any;
  }
}

const TESTIMONIALS = [
  {
    text: "I signed up at 11pm on a Tuesday. By Wednesday morning, my agent had already closed two pool maintenance contracts.",
    author: "Mike T., HVAC Florida",
  },
];

function getRecommendedPlan(contractValue: string | null): PlanId {
  if (!contractValue) return "growth";
  if (contractValue === "Under $500") return "starter";
  if (contractValue === "$5,000+") return "agency";
  return "growth";
}

const DEADLINE = new Date("2026-07-15T00:00:00");

function getDaysLeft(): number {
  const diff = DEADLINE.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function PlanPage() {
  const router = useRouter();
  const t = useTranslations("plan");
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<PlanId>("growth");
  const [spotsLeft, setSpotsLeft] = useState<number>(12);
  const checkoutStartedRef = useRef(false);
  const daysLeft = getDaysLeft();

  // Handle Stripe success redirect back to this page (legacy fallback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") !== "true") return;
    router.replace("/dashboard?checkout_success=true");
  }, [router]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: { count?: number }) => {
        if (typeof d.count === "number") setSpotsLeft(d.count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    window.fbq?.("track", "InitiateCheckout");
    posthog.capture("plan_page_viewed");

    // Fire checkout_abandoned if they leave within 30s without starting checkout
    const timer = setTimeout(() => {
      if (!checkoutStartedRef.current) {
        posthog.capture("checkout_abandoned", { seconds_on_page: 30 });
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("agents")
      .select("agent_name, business_name, contract_value")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setAgentName((data as { agent_name: string | null }).agent_name);
          setBusinessName((data as { business_name: string }).business_name);
          setRecommendedPlan(
            getRecommendedPlan(
              (data as { contract_value: string | null }).contract_value
            )
          );
        }
      });
  }, []);

  async function selectPlan(planId: PlanId) {
    posthog.capture("plan_selected", { plan: planId });
    setCheckoutLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? t("checkoutFailed"));
        setCheckoutLoading(null);
        return;
      }
      checkoutStartedRef.current = true;
      posthog.capture("checkout_started", { plan: planId });
      window.fbq?.("track", "StartTrial");
      window.location.href = data.url;
    } catch {
      setError(t("networkError"));
      setCheckoutLoading(null);
    }
  }

  const checkIcon = (dark = false) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path
        d="M2.5 7l3 3 6-6"
        stroke={dark ? "#0a0a0a" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0a0a]">
      <div className="flex w-full flex-col items-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <img src="/logo.svg" alt="Forgee" height="28" />
      </div>

      {/* ── 60-day hero banner ── */}
      <div className="mb-8 w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-amber-500/10 px-8 py-7 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-400/70">Limited time offer</p>
        <p className="mb-2 text-4xl font-bold tracking-tight text-amber-400 sm:text-5xl">{t("heroBanner")}</p>
        <p className="text-sm text-amber-300/70">{t("heroBannerSub")}</p>
      </div>

      {/* Hero */}
      <div className="mb-6 max-w-xl text-center">
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {agentName ? t("readyNamed", { name: agentName }) : t("ready")}
        </h1>
        <p className="text-base text-white/50">{t("subtitle")}</p>
      </div>

      {/* ── Founder pricing card ── */}
      <div className="mx-auto mb-10 w-full max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          <span className="text-sm font-semibold uppercase tracking-wide text-amber-400">
            Founder pricing — Locked until July 15 · {daysLeft} days left
          </span>
        </div>
        <p className="mb-4 text-sm text-zinc-300">
          Sign up before July 15, 2026 to lock today&apos;s pricing forever.
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Starter", current: "$97", future: "$147" },
            { label: "Growth", current: "$297", future: "$397" },
            { label: "Agency", current: "$697", future: "$997" },
          ].map(({ label, current, future }) => (
            <div key={label}>
              <div className="mb-1 text-xs text-zinc-500">{label}</div>
              <div className="text-sm">
                <span className="font-semibold text-white">{current}</span>
                <span className="text-zinc-500"> → </span>
                <span className="text-zinc-500 line-through">{future}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reassurance section ── */}
      <div className="mb-10 w-full max-w-3xl">
        <p className="mb-5 text-center text-xl font-semibold text-white">
          {t("noChargeTitle")}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            { icon: "🔒", titleKey: "reassure1Title", descKey: "reassure1Desc" },
            { icon: "⚡", titleKey: "reassure2Title", descKey: "reassure2Desc" },
            { icon: "📧", titleKey: "reassure3Title", descKey: "reassure3Desc" },
          ] as const).map(({ icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-4"
            >
              <span className="text-xl">{icon}</span>
              <p className="text-sm font-semibold text-white">{t(titleKey)}</p>
              <p className="text-xs leading-relaxed text-white/45">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 w-full max-w-3xl rounded-lg border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="mb-10 grid w-full max-w-4xl grid-cols-1 items-center gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isFeatured = plan.featured;
          const isRecommended = plan.id === recommendedPlan;
          const isLoading = checkoutLoading === plan.id;

          if (isFeatured) {
            return (
              <div
                key={plan.id}
                className="relative order-first rounded-2xl bg-white p-7 md:order-none md:scale-[1.04] md:shadow-2xl"
              >
                {isRecommended && businessName && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-[#0a0a0a]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0a0a0a]">
                    {t("recommendedFor", { name: businessName })}
                  </div>
                )}
                {plan.badge && !isRecommended && (
                  <div className="mb-3 inline-flex items-center rounded-full bg-[#0a0a0a]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0a0a0a]">
                    {plan.badge}
                  </div>
                )}
                <h2 className="text-lg font-semibold text-[#0a0a0a]">{plan.name}</h2>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#0a0a0a]">$0</span>
                    <span className="text-sm text-[#0a0a0a]/50">for 60 days</span>
                  </div>
                  <p className="mt-0.5 text-sm text-[#0a0a0a]/40">Then ${plan.price}{t("perMonth")}</p>
                </div>
                <ul className="mb-6 mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#0a0a0a]/70">
                      {checkIcon(true)}
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={checkoutLoading !== null}
                  onClick={() => selectPlan(plan.id)}
                  className="w-full rounded-lg bg-[#0a0a0a] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? t("redirecting") : t("startTrialArrow")}
                </button>
              </div>
            );
          }

          return (
            <div
              key={plan.id}
              className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7"
            >
              {isRecommended && businessName && (
                <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-white/60">
                  {t("recommendedFor", { name: businessName })}
                </div>
              )}
              <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">$0</span>
                  <span className="text-sm text-white/40">for 60 days</span>
                </div>
                <p className="mt-0.5 text-sm text-white/30">Then ${plan.price}{t("perMonth")}</p>
              </div>
              <ul className="mb-6 mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    {checkIcon()}
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={checkoutLoading !== null}
                onClick={() => selectPlan(plan.id)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.06] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.10] disabled:opacity-50"
              >
                {isLoading ? t("redirecting") : t("startTrialFlat")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Billing disclosure */}
      <div className="mb-8 w-full max-w-2xl rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-5">
        <p className="mb-4 text-sm font-semibold text-white">{t("billingTitle")}</p>
        <ol className="flex flex-col gap-2.5">
          {([t("billing1"), t("billing2"), t("billing3"), t("billing4"), t("billing5")] as string[]).map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] font-semibold text-white/40">
                {i + 1}
              </span>
              <span className="text-sm text-white/55">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-center text-sm font-semibold text-white/80">{t("billingNote")}</p>
      </div>

      {/* Spots urgency */}
      <div className="mb-8 w-full max-w-2xl rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 text-center">
        <p className="text-xs text-white/40">
          ⏰ This offer ends when we reach 100 users. Currently:{" "}
          <span className="font-semibold text-white/70">{t("spotsLabel", { spots: spotsLeft })}</span>
        </p>
      </div>

      {/* Trust row */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {[
          { icon: "🔒", key: "trustSsl" },
          { icon: "💳", key: "trustNoCard" },
          { icon: "✕", key: "trustCancel" },
        ].map((item) => (
          <span key={item.key} className="flex items-center gap-1.5 text-xs text-white/30">
            <span>{item.icon}</span>
            {t(item.key)}
          </span>
        ))}
      </div>

      {/* Testimonial */}
      {TESTIMONIALS.map((testimonial) => (
        <div
          key={testimonial.author}
          className="mb-10 w-full max-w-xl rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-5 text-center"
        >
          <p className="text-sm leading-relaxed text-white/60">
            &ldquo;{testimonial.text}&rdquo;
          </p>
          <p className="mt-3 text-xs font-medium text-white/30">— {testimonial.author}</p>
        </div>
      ))}

      {/* Guarantee */}
      <div className="mb-8 w-full max-w-xl rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5L10 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-white">{t("guaranteeTitle")}</p>
            <p className="text-xs leading-relaxed text-white/50">{t("guaranteeDesc")}</p>
          </div>
        </div>
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="text-xs text-white/25 underline underline-offset-4 transition-colors hover:text-white/50"
      >
        {t("skipForNow")}
      </button>
      </div>
    </div>
  );
}
