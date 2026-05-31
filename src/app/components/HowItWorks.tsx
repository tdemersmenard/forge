"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Describe your business",
    desc: "Tell us your services, prices, and what makes a good lead. Takes 5 minutes.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 8h8M7 11h5M7 14h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Connect your phone number",
    desc: "Link a Twilio number in 2 clicks. Your agent is instantly reachable via SMS.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="6" y="2" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="11" cy="17" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Watch it close deals",
    desc: "Your agent qualifies every lead, sends quotes, and books jobs — 24/7, no days off.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 12l5 5L18 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
            How it works
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Live in 15 minutes, not 15 weeks
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent md:block" />

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center md:items-start md:text-left"
              >
                {/* Number + icon */}
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/60">
                    {step.icon}
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] border border-white/10 text-[11px] font-semibold text-white/40">
                    {step.number}
                  </span>
                </div>

                <h3 className="mb-2 text-base font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/40">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
