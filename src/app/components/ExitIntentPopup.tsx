"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";

export default function ExitIntentPopup() {
  const t = useTranslations("exitIntent");
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem("forgee_exit_popup_dismissed")) return;

    function handleMouseLeave(e: MouseEvent) {
      if (triggered.current) return;
      if (e.clientY <= 0) {
        triggered.current = true;
        setVisible(true);
        posthog.capture("exit_intent_popup_shown");
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("forgee_exit_popup_dismissed", "1");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    try {
      await fetch("/api/leads/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Fail silently
    }

    posthog.capture("exit_intent_email_submitted");
    setLoading(false);
    setSubmitted(true);
    setTimeout(dismiss, 2500);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111] p-8">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/[0.04] to-transparent" />

              <button
                onClick={dismiss}
                className="absolute right-4 top-4 text-white/30 transition-colors hover:text-white/70"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4 text-center"
                >
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M4 11l5 5L18 6" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{t("successTitle")}</h3>
                  <p className="text-sm text-white/40">{t("successDesc")}</p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1">
                      <span className="text-xs font-medium text-amber-400">{t("badge")}</span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-white">{t("heading")}</h3>
                    <p className="text-sm text-white/40">{t("desc")}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("emailPlaceholder")}
                      className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-10 rounded-md bg-white text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? t("saving") : t("cta")}
                    </button>
                    <button
                      type="button"
                      onClick={dismiss}
                      className="text-xs text-white/25 transition-colors hover:text-white/50"
                    >
                      {t("decline")}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
