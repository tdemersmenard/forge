"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-14 text-center">
      <div className="mx-auto max-w-3xl">
        {/* Badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-white/70">{t("badge")}</span>
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-semibold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
          {t("line1")}
          <br />
          {t("line2")}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/50">
          {t("subtitle")}
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/onboarding"
            className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            {t("startFree")}
          </Link>
          <a
            href="#"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-6 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
              <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" />
            </svg>
            {t("seeDemo")}
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-sm text-white/30">
          {t("trustedBy")}{" "}
          <span className="font-medium text-white/60">{t("trustedCount")}</span>{" "}
          {t("trustedSuffix")}
          {" "}·{" "}
          <span className="font-medium text-white/60">{t("revenue")}</span>{" "}
          {t("revenueSuffix")}
        </p>
      </div>
    </section>
  );
}
