"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const rows = [
  { feature: "Available 24/7", forgee: true, receptionist: false, diy: false },
  { feature: "Responds in < 30 seconds", forgee: true, receptionist: false, diy: false },
  { feature: "Qualifies every lead", forgee: true, receptionist: true, diy: false },
  { feature: "Sends quotes automatically", forgee: true, receptionist: false, diy: false },
  { feature: "Handles 100+ leads at once", forgee: true, receptionist: false, diy: false },
  { feature: "No salary or benefits", forgee: true, receptionist: false, diy: true },
  { feature: "Setup in 15 minutes", forgee: true, receptionist: false, diy: false },
  { feature: "Gets smarter over time", forgee: true, receptionist: false, diy: false },
];

function Check({ yes }: { yes: boolean }) {
  if (yes) {
    return (
      <span className="flex items-center justify-center">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center">
      <span className="h-px w-4 bg-white/15" />
    </span>
  );
}

export default function ComparisonTable() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
            Why Forgee
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Replace your front desk.
            <br />
            <span className="text-white/40">Not your whole team.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="overflow-hidden rounded-xl border border-white/[0.08]"
        >
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="px-5 py-4" />
            <div className="px-4 py-4 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5">
                <span className="text-xs font-semibold text-[#0a0a0a]">Forgee</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="px-4 py-4 text-center">
              <span className="text-xs font-medium text-white/40">Receptionist</span>
            </div>
            <div className="px-4 py-4 text-center">
              <span className="text-xs font-medium text-white/40">DIY / Manual</span>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-4 border-b border-white/[0.04] ${
                i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
              }`}
            >
              <div className="px-5 py-3.5">
                <span className="text-sm text-white/60">{row.feature}</span>
              </div>
              <div className="py-3.5">
                <Check yes={row.forgee} />
              </div>
              <div className="py-3.5">
                <Check yes={row.receptionist} />
              </div>
              <div className="py-3.5">
                <Check yes={row.diy} />
              </div>
            </div>
          ))}

          {/* Cost row */}
          <div className="grid grid-cols-4 bg-white/[0.02] px-0">
            <div className="px-5 py-4">
              <span className="text-sm font-medium text-white/80">Monthly cost</span>
            </div>
            <div className="flex items-center justify-center py-4">
              <span className="text-sm font-semibold text-emerald-400">From $97/mo</span>
            </div>
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-white/40">$3,000–6,000</span>
            </div>
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-white/40">Your time</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
