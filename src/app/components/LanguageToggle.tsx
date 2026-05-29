"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold">
      <button
        onClick={() => setLocale("fr")}
        className={`px-2.5 py-1 transition-colors ${
          locale === "fr"
            ? "bg-white text-[#0a0a0a]"
            : "text-white/40 hover:text-white/70"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 transition-colors ${
          locale === "en"
            ? "bg-white text-[#0a0a0a]"
            : "text-white/40 hover:text-white/70"
        }`}
      >
        EN
      </button>
    </div>
  );
}
