"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectPlan(planId: PlanId) {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Failed to start checkout. Please try again.");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0a0a] px-4 py-12">
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

      {/* Progress indicator */}
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[#0a0a0a]">
          1
        </div>
        <span className="text-xs text-white/50">Choose your plan</span>
        <span className="text-white/20">·</span>
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[10px] font-semibold text-white/30">
          2
        </div>
        <span className="text-xs text-white/30">Set up your agent</span>
      </div>

      {/* Hero */}
      <div className="mb-12 max-w-xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          Start your 7-day free trial
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Your AI agent is almost ready.
        </h1>
        <p className="text-base text-white/50">
          Pick a plan to deploy. Cancel anytime. No charge for 7 days.
        </p>
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
          const isLoading = loading === plan.id;

          if (isFeatured) {
            return (
              <div
                key={plan.id}
                className="relative order-first rounded-2xl bg-white p-7 md:order-none md:scale-[1.04] md:shadow-2xl"
              >
                <div className="mb-5">
                  {plan.badge && (
                    <span className="mb-3 inline-block rounded-full bg-[#0a0a0a]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0a0a0a]">
                      {plan.badge}
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-[#0a0a0a]">
                    {plan.name}
                  </h2>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#0a0a0a]">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-[#0a0a0a]/50">/mo</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#0a0a0a]/70">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                        <path d="M2.5 7l3 3 6-6" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => selectPlan(plan.id)}
                  className="w-full rounded-lg bg-[#0a0a0a] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Redirecting…" : "Start free trial →"}
                </button>
              </div>
            );
          }

          return (
            <div
              key={plan.id}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7"
            >
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-white/40">/mo</span>
                </div>
              </div>
              <ul className="mb-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => selectPlan(plan.id)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.06] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.10] disabled:opacity-50"
              >
                {isLoading ? "Redirecting…" : "Start free trial"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust row */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {[
          { icon: "🔒", text: "256-bit SSL encryption" },
          { icon: "💳", text: "No credit card stored until trial ends" },
          { icon: "✕", text: "Cancel anytime in 2 clicks" },
        ].map((item) => (
          <span key={item.text} className="flex items-center gap-1.5 text-xs text-white/30">
            <span>{item.icon}</span>
            {item.text}
          </span>
        ))}
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={() => router.push("/onboarding")}
        className="text-xs text-white/25 underline underline-offset-4 transition-colors hover:text-white/50"
      >
        Skip for now — explore the dashboard first
      </button>
    </div>
  );
}
