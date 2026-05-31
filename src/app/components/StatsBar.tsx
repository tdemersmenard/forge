"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const STAT_KEYS = ["stat1", "stat2", "stat3"] as const;

export default function StatsBar() {
  const t = useTranslations("stats");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="border-y border-white/[0.06] bg-white/[0.02]">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 divide-y divide-white/[0.06] md:grid-cols-3 md:divide-x md:divide-y-0">
          {STAT_KEYS.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center justify-center px-8 py-10"
            >
              <span className="mb-1.5 text-3xl font-semibold tracking-tight text-white">
                {t(`${key}.value`)}
              </span>
              <span className="text-sm text-white/40">{t(`${key}.label`)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
