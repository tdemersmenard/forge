"use client";

import { useState } from "react";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

type SubscriptionData = {
  plan: string;
  plan_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
} | null;

type Invoice = {
  id: string;
  amount_paid: number;
  status: string | null;
  created: number;
  invoice_pdf: string | null;
};

interface Props {
  subscription: SubscriptionData;
  conversationsThisMonth: number;
  trialDaysRemaining: number | null;
  invoices: Invoice[];
}

export function BillingClient({
  subscription,
  conversationsThisMonth,
  trialDaysRemaining,
  invoices,
}: Props) {
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = subscription?.plan ?? "trial";
  const isTrialing =
    subscription?.plan_status === "trialing" || !subscription;

  async function handleUpgrade(planId: PlanId) {
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
        setError(data.error ?? "Checkout failed — try again.");
        setCheckoutLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open billing portal.");
        setPortalLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
      setPortalLoading(false);
    }
  }

  const currentPlanData = PLANS.find((p) => p.id === currentPlan);
  const limit = currentPlanData?.limit ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Trial banner */}
      {isTrialing && trialDaysRemaining !== null && (
        <div className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-amber-400">
              {trialDaysRemaining > 0
                ? `Your free trial ends in ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""}`
                : "Your free trial has ended"}
            </p>
            <p className="mt-0.5 text-xs text-amber-400/60">
              Activate a plan below to keep your agent running.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleUpgrade("growth")}
            disabled={checkoutLoading !== null}
            className="ml-4 shrink-0 rounded-md bg-amber-400 px-4 py-2 text-xs font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Activate now →
          </button>
        </div>
      )}

      {/* Current plan + usage */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-white/40">Current plan</p>
            <p className="mt-1 text-xl font-semibold capitalize text-white">
              {currentPlan === "trial" ? "Free Trial" : currentPlan}
            </p>
            {subscription?.plan_status && (
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  subscription.plan_status === "active"
                    ? "bg-emerald-400/10 text-emerald-400"
                    : subscription.plan_status === "trialing"
                    ? "bg-amber-400/10 text-amber-400"
                    : subscription.plan_status === "canceled"
                    ? "bg-red-400/10 text-red-400"
                    : "bg-white/[0.06] text-white/40"
                }`}
              >
                {subscription.plan_status}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {subscription?.stripe_customer_id && (
              <button
                type="button"
                disabled={portalLoading}
                onClick={handlePortal}
                className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                {portalLoading ? "Opening…" : "Manage subscription"}
              </button>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="mt-5 border-t border-white/[0.05] pt-5">
          <p className="mb-3 text-xs font-medium text-white/40">
            Usage this month
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-semibold text-white">
                {conversationsThisMonth.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-white/35">
                {limit ? `of ${limit.toLocaleString()} conversations` : "conversations · unlimited"}
              </p>
            </div>
          </div>
          {limit && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${Math.min(100, (conversationsThisMonth / limit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        {subscription?.stripe_customer_id && subscription.plan_status === "active" && (
          <p className="mt-4 text-xs text-white/25">
            View exact billing dates in the customer portal →
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-white">
          {currentPlan === "trial" ? "Choose a plan" : "Change plan"}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isFeatured = plan.featured;
            const isLoading = checkoutLoading === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-5 ${
                  isFeatured
                    ? "border border-white/20 bg-white/[0.06]"
                    : "border border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                {plan.badge && (
                  <span className="mb-3 inline-block rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/60">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                <div className="mt-1 mb-4 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-xs text-white/40">/mo</span>
                </div>
                <ul className="mb-5 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                        <path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs font-medium text-white/50">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Current plan
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={checkoutLoading !== null}
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full rounded-lg py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      isFeatured
                        ? "bg-white text-[#0a0a0a] hover:opacity-90"
                        : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.10]"
                    }`}
                  >
                    {isLoading ? "Redirecting…" : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing history */}
      {invoices.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Billing history
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Date", "Amount", "Status", ""].map((col) => (
                  <th
                    key={col}
                    className="pb-3 text-left text-[11px] font-medium uppercase tracking-wider text-white/30"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 text-xs text-white/60">
                    {new Date(inv.created * 1000).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 text-xs text-white/60">
                    ${(inv.amount_paid / 100).toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        inv.status === "paid"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-white/[0.06] text-white/40"
                      }`}
                    >
                      {inv.status ?? "—"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {inv.invoice_pdf && (
                      <a
                        href={inv.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/30 transition-colors hover:text-white/60"
                      >
                        PDF →
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
