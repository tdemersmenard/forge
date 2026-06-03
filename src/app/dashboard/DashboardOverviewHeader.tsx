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
  trialDaysRemaining?: number | null;
}

export function DashboardOverviewHeader({ email, showSuccess, checkoutSuccess, plan, trialDaysRemaining }: Props) {
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
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4">
          <p className="text-sm text-amber-400">
            <span className="font-semibold">
              {trialDaysRemaining === 0
                ? "Your free trial ends today"
                : trialDaysRemaining === 1
                ? "Your free trial ends in 1 day"
                : `Your free trial ends in ${trialDaysRemaining} days`}
            </span>
            {" — activate your plan to keep your agent running."}
          </p>
          <a
            href="/dashboard/billing"
            className="ml-4 shrink-0 rounded-md bg-amber-400 px-4 py-2 text-xs font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            Activate now →
          </a>
        </div>
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
