"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

type PlanKey = "starter" | "growth" | "agency";

const PLAN_KEYS: { key: PlanKey; price: string; highlighted: boolean; badge?: true }[] = [
  { key: "starter", price: "$97", highlighted: false },
  { key: "growth", price: "$297", highlighted: true, badge: true },
  { key: "agency", price: "$697", highlighted: false },
];

export default function Pricing() {
  const t = useTranslations("pricing");

  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
            {t("label")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-sm text-white/40">{t("subtitle")}</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLAN_KEYS.map(({ key, price, highlighted, badge }) => {
            const features = [
              t(`${key}.feat1`),
              t(`${key}.feat2`),
              t(`${key}.feat3`),
              t(`${key}.feat4`),
              t(`${key}.feat5`),
              t(`${key}.feat6`),
            ];

            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-xl p-7 ${
                  highlighted
                    ? "bg-white text-[#0a0a0a]"
                    : "border border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#0a0a0a] px-3 py-1 text-xs font-medium text-white border border-white/10">
                      {t("mostPopular")}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <p className={`mb-4 text-sm font-semibold ${highlighted ? "text-[#0a0a0a]" : "text-white"}`}>
                    {t(`${key}.name`)}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-semibold tracking-tight ${highlighted ? "text-[#0a0a0a]" : "text-white"}`}>
                      {price}
                    </span>
                    <span className={`text-sm ${highlighted ? "text-[#0a0a0a]/60" : "text-white/40"}`}>
                      {t("perMonth")}
                    </span>
                  </div>
                  <p className={`mt-3 text-sm ${highlighted ? "text-[#0a0a0a]/60" : "text-white/40"}`}>
                    {t(`${key}.desc`)}
                  </p>
                </div>

                {/* Features */}
                <ul className="mb-8 flex flex-col gap-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className={highlighted ? "text-[#0a0a0a]" : "text-white/50"}
                      >
                        <path
                          d="M2.5 7l3.5 3.5 5.5-7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className={`text-sm ${highlighted ? "text-[#0a0a0a]/80" : "text-white/50"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/signup"
                  className={`mt-auto block rounded-md py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                    highlighted
                      ? "bg-[#0a0a0a] text-white"
                      : "border border-white/10 text-white hover:border-white/20"
                  }`}
                >
                  {t(`${key}.cta`)}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
