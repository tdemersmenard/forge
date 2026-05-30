"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "./LanguageToggle";

export default function Navbar() {
  const t = useTranslations("navbar");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <a href="/">
          <img src="/logo.svg" alt="Forgee" height="28" />
        </a>

        {/* Nav links */}
        <nav className="hidden items-center gap-7 md:flex">
          {(["product", "pricing", "docs"] as const).map((key) => (
            <a
              key={key}
              href={`#${key}`}
              className="text-sm text-white/50 transition-colors hover:text-white/90"
            >
              {t(key)}
            </a>
          ))}
        </nav>

        {/* Right side: lang toggle + CTA */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/login"
            className="text-sm text-white/50 transition-colors hover:text-white/90"
          >
            {t("logIn")}
          </Link>
          <Link
            href="/onboarding"
            className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            {t("getStarted")}
          </Link>
        </div>
      </div>
    </header>
  );
}
