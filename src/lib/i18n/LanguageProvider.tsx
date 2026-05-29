"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

export type Locale = "en" | "fr";

const MESSAGES: Record<Locale, typeof enMessages> = {
  en: enMessages,
  fr: frMessages as typeof enMessages,
};

type LanguageContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("forgee_lang") as Locale | null;
    if (saved === "en" || saved === "fr") {
      setLocaleState(saved);
    } else {
      const browserFr = navigator.language.toLowerCase().startsWith("fr");
      setLocaleState(browserFr ? "fr" : "en");
    }
  }, []);

  function setLocale(l: Locale) {
    localStorage.setItem("forgee_lang", l);
    setLocaleState(l);
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={locale}
        messages={MESSAGES[locale]}
        timeZone="America/Toronto"
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
