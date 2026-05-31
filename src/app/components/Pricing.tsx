"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

type PlanKey = "starter" | "growth" | "agency";

const PLAN_KEYS: { key: PlanKey; price: string; highlighted: boolean; badge?: true }[] = [
  { key: "starter", price: "$97", highlighted: false },
  { key: "growth", price: "$297", highlighted: true, badge: true },
  { key: "agency", price: "$697", highlighted: false },
];

// Countdown to end of month (urgency)
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calc() {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      const diff = end.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000) % 24;
      const minutes = Math.floor(diff / 60000) % 60;
      const seconds = Math.floor(diff / 1000) % 60;
      setTimeLeft({ hours, minutes, seconds });
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);

  return timeLeft;
}

function Digit({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-[1.8ch] font-mono text-amber-400">
      {String(value).padStart(2, "0")}
    </span>
  );
}

export default function Pricing() {
  const t = useTranslations("pricing");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { hours, minutes, seconds } = useCountdown();

  return (
    <section id="pricing" ref={ref} className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
            {t("label")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-sm text-white/40">{t("subtitle")}</p>
        </motion.div>

        {/* Urgency banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-10 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-4"
        >
          <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              Founder pricing ends in{" "}
              <Digit value={hours} />h <Digit value={minutes} />m <Digit value={seconds} />s
            </span>
          </div>
          <span className="text-xs text-white/30">Lock in your rate before prices increase →</span>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLAN_KEYS.map(({ key, price, highlighted, badge }, i) => {
            const features = [
              t(`${key}.feat1`),
              t(`${key}.feat2`),
              t(`${key}.feat3`),
              t(`${key}.feat4`),
              t(`${key}.feat5`),
              t(`${key}.feat6`),
            ];

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
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
                  href="/onboarding"
                  className={`mt-auto block rounded-md py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                    highlighted
                      ? "bg-[#0a0a0a] text-white"
                      : "border border-white/10 text-white hover:border-white/20"
                  }`}
                >
                  {t(`${key}.cta`)}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center text-xs text-white/20"
        >
          7-day free trial · No credit card until trial ends · Cancel anytime in 2 clicks
        </motion.p>
      </div>
    </section>
  );
}
