"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "How long does setup actually take?",
    a: "Most users are live in under 15 minutes. You fill out a form describing your business — services, prices, hours — and we generate your agent instantly. No engineers, no calls.",
  },
  {
    q: "Do I need to know how to code?",
    a: "Not at all. Forgee is built for business owners, not developers. If you can fill out a form, you can deploy an agent.",
  },
  {
    q: "What happens when a lead texts in?",
    a: "Your agent picks up immediately, asks qualifying questions, gives pricing info, and tries to book an on-site assessment or consultation. If the lead doesn't qualify, the conversation ends cleanly. No human time wasted.",
  },
  {
    q: "Can I customize what my agent says?",
    a: "Yes — you control the tone (professional, friendly, or direct), the language (EN, FR, or bilingual), what questions it asks, what it should never say, and when to escalate to you.",
  },
  {
    q: "What if a lead asks something my agent doesn't know?",
    a: "You define escalation criteria upfront. When those are triggered — angry customer, complex legal question, anything outside your agent's knowledge — it hands off to you with full context.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted at rest and in transit. We never store raw Twilio auth tokens in your browser. Conversation data lives in an isolated Supabase database scoped to your account.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium text-white/80">{q}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-white/40"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-white/40">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
            FAQ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Questions we always get
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.02] px-6"
        >
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
