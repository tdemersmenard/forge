"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { PLANS } from "@/lib/plans";
import posthog from "posthog-js";

declare global {
  interface Window {
    fbq: any;
  }
}

interface Props {
  email: string;
  showSuccess: boolean;
  checkoutSuccess?: boolean;
  plan?: string | null;
  planStatus?: string | null;
  trialDaysRemaining?: number | null;
  trialEndDate?: string | null;
  trialDayNumber?: number | null;
}

export function DashboardOverviewHeader({ email, showSuccess, checkoutSuccess, plan, planStatus, trialDaysRemaining, trialEndDate, trialDayNumber }: Props) {
  const t = useTranslations("dashboard");

  useEffect(() => {
    if (!showSuccess && !checkoutSuccess) return;
    const planData = PLANS.find((p) => p.id === plan);
    const value = planData?.price ?? 97;
    window.fbq?.("track", "Purchase", { value, currency: "USD" });
  }, [showSuccess, checkoutSuccess, plan]);

  useEffect(() => {
    if (!checkoutSuccess) return;
    localStorage.setItem("forgee_just_subscribed", "true");
    posthog.capture("subscription_started", { plan });
  }, [checkoutSuccess, plan]);

  return (
    <>
      {planStatus === "inactive" && !checkoutSuccess && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-amber-400">
              ⚠️ Your agent is built but NOT active.
            </p>
            <p className="mt-0.5 text-xs text-amber-400/70">
              Activate your free trial to start receiving leads.
            </p>
          </div>
          <a
            href="/dashboard/billing"
            className="ml-4 shrink-0 rounded-md bg-amber-400 px-4 py-2 text-xs font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            Activate now →
          </a>
        </div>
      )}

      {(showSuccess || checkoutSuccess) && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4">
          <span className="mt-0.5 text-lg leading-none">🎉</span>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              {t("agentActive")}
            </p>
            <p className="mt-0.5 text-xs text-emerald-400/70">
              {t("agentActiveDesc")}
            </p>
          </div>
        </div>
      )}

      {trialDaysRemaining !== null && trialDaysRemaining !== undefined && (
        trialDaysRemaining <= 7 ? (
          // Urgent banner (orange) — ≤7 days left
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-orange-500/30 bg-orange-500/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-400">
                {trialDaysRemaining === 0
                  ? "⏰ Your free trial ends today."
                  : trialDaysRemaining === 1
                  ? `⏰ Your free trial ends tomorrow${trialEndDate ? ` (${trialEndDate})` : ""}.`
                  : `⏰ Your free trial ends in ${trialDaysRemaining} days${trialEndDate ? ` on ${trialEndDate}` : ""}.`}
              </p>
              <p className="mt-0.5 text-xs text-orange-400/70">
                After that, your plan starts billing. Cancel anytime in 2 clicks.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <a
                href="/dashboard/billing"
                className="rounded-md bg-orange-400 px-4 py-2 text-xs font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90"
              >
                Keep my agent →
              </a>
              <a href="/dashboard/billing" className="text-xs text-orange-400/60 underline hover:text-orange-400">
                Cancel
              </a>
            </div>
          </div>
        ) : (
          // Subtle banner — full trial period
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-5 py-3.5">
            <p className="text-sm text-emerald-400/80">
              <span className="font-semibold text-emerald-400">
                🎁 Free trial{trialDayNumber !== null ? ` — Day ${trialDayNumber} of 60` : ""}.
              </span>
              {" "}
              {trialDaysRemaining} days remaining.
              {trialEndDate ? ` No charge until ${trialEndDate}.` : ""}
            </p>
          </div>
        )
      )}

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-white/40">
          {t("welcomeBack")}{" "}
          <span className="text-white/70">{email}</span>
        </p>
      </div>
    </>
  );
}
