"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Lang = "en" | "fr";

const T = {
  en: {
    heading: (name: string) => `Welcome back, ${name}!`,
    subtitle: (agent: string) => `Your agent ${agent} is ready to start working for you.`,
    recapTitle: "Here's what you built:",
    agentName: "Agent name",
    business: "Business",
    sector: "Sector",
    services: (n: number) => `${n} service${n === 1 ? "" : "s"} configured`,
    questions: (n: number) => `${n} qualification question${n === 1 ? "" : "s"}`,
    tone: "Tone",
    language: "Language",
    cta: "Activate my agent — Start free trial →",
    secondary: "Edit my agent settings instead",
  },
  fr: {
    heading: (name: string) => `Bon retour, ${name}!`,
    subtitle: (agent: string) => `Votre agent ${agent} est prêt à travailler pour vous.`,
    recapTitle: "Voici ce que vous avez construit\u00a0:",
    agentName: "Nom de l'agent",
    business: "Entreprise",
    sector: "Secteur",
    services: (n: number) => `${n} service${n > 1 ? "s" : ""} configuré${n > 1 ? "s" : ""}`,
    questions: (n: number) => `${n} question${n > 1 ? "s" : ""} de qualification`,
    tone: "Ton",
    language: "Langue",
    cta: "Activer mon agent — Essai gratuit →",
    secondary: "Modifier les paramètres de mon agent",
  },
};

interface Props {
  firstName: string;
  agentName: string;
  businessName: string;
  sector: string;
  serviceCount: number;
  questionCount: number;
  tone: string;
  language: string;
}

export function WelcomeBackClient({
  firstName,
  agentName,
  businessName,
  sector,
  serviceCount,
  questionCount,
  tone,
  language,
}: Props) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("forgee_lang") as Lang | null;
    if (stored === "en" || stored === "fr") setLang(stored);
  }, []);

  const t = T[lang];

  const recapItems = [
    { label: t.agentName, value: agentName },
    { label: t.business, value: businessName },
    { label: t.sector, value: sector },
    { label: t.services(serviceCount), value: null },
    { label: t.questions(questionCount), value: null },
    { label: t.tone, value: tone },
    { label: t.language, value: language },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 py-16">
      <div className="w-full max-w-md">
        {/* Animated checkmark */}
        <div className="mb-8 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.08]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <motion.path
                d="M8 20l8 8 16-16"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
              />
            </svg>
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              className="absolute inset-0 rounded-full border border-emerald-400/30"
            />
          </div>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-2 text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {t.heading(firstName)}
          </h1>
          <p className="mt-2 text-base text-white/50">{t.subtitle(agentName)}</p>
        </motion.div>

        {/* Recap card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-5"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">
            {t.recapTitle}
          </p>
          <div className="flex flex-col gap-2.5">
            {recapItems.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-emerald-400">✓</span>
                <span className="text-sm text-white/70">
                  {label}
                  {value ? (
                    <span className="font-medium text-white">: {value}</span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <a
            href="/onboarding/plan"
            className="w-full rounded-lg bg-white px-6 py-3 text-center text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            {t.cta}
          </a>
          <a
            href="/onboarding"
            className="text-xs text-white/30 underline underline-offset-4 transition-colors hover:text-white/60"
          >
            {t.secondary}
          </a>
        </motion.div>
      </div>
    </div>
  );
}
