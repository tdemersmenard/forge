"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { type Variants, motion } from "framer-motion";
import { useEffect, useState } from "react";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-medium text-white/60">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-14 text-center">
      <motion.div
        className="mx-auto max-w-3xl"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-white/70">{t("badge")}</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="mb-6 text-5xl font-semibold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl"
        >
          {t("line1")}
          <br />
          {t("line2")}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/50"
        >
          {t("subtitle")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            href="/onboarding"
            className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            {t("startFree")}
          </Link>
          <a
            href="#demo"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-6 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
              <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" />
            </svg>
            {t("seeDemo")}
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.p variants={itemVariants} className="mt-10 text-sm text-white/30">
          {t("trustedBy")}{" "}
          <AnimatedCounter target={1200} suffix="+" />{" "}
          {t("trustedSuffix")}
          {" "}·{" "}
          <AnimatedCounter target={42} />{" "}
          <span className="font-medium text-white/60">M{t("revenueSuffix")}</span>
        </motion.p>
      </motion.div>
    </section>
  );
}
