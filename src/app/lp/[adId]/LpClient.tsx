"use client";

import { useState, useRef, useEffect } from "react";
import posthog from "posthog-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string };

interface Props {
  adId: string;
  h1: string;
  subtitle: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hey! I'm Max from PoolPro 👋 Looking to get your pool cleaned or serviced?",
};

const STORAGE_KEY = "forgee_lp_demo_messages";

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "Will it sound robotic to my leads?",
    a: "Not at all. You choose the tone — professional, friendly, or direct. The agent sticks to it every single time. Most leads don't realize they're talking to AI until they're already qualified.",
  },
  {
    q: "What if I have no technical knowledge?",
    a: "None needed. If you can fill out a form, you can deploy an agent. The only slightly technical step is connecting a phone number — we walk you through it step by step in under 3 minutes.",
  },
  {
    q: "What happens after the 60-day trial?",
    a: "We'll email you on day 53, 57, and 59 before your trial ends. If you keep going, you're billed monthly. Nothing happens automatically without warning.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — 2 clicks from your billing page. No contracts, no penalties, no awkward cancellation calls. Your data stays available for 30 days after.",
  },
];

// ─── Demo component ───────────────────────────────────────────────────────────

function LpDemo({ adId }: { adId: string }) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const hasTrackedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Restore conversation from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore malformed data
    }
    setHydrated(true);
  }, []);

  // Persist conversation to localStorage whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage errors
    }
  }, [messages, hydrated]);

  // Scroll messages container to bottom on new message
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const QUICK_REPLIES = ["Yes, I need a quote", "What's included?", "How much does it cost?"];

  async function send(text: string) {
    if (!text.trim() || loading) return;

    if (!hasTrackedRef.current) {
      hasTrackedRef.current = true;
      posthog.capture("lp_demo_used", { adId });
    }

    const userMsg: Message = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang: "en" }),
      });
      const data = (await res.json()) as { reply?: string };
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-white">9:41</span>
          <div className="h-2 w-4 rounded-sm border border-white/40">
            <div className="h-full w-3/4 rounded-sm bg-white/60" />
          </div>
        </div>

        {/* Agent header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Max · PoolPro</p>
            <p className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex h-64 flex-col gap-3 overflow-y-auto px-4 py-4 sm:h-72"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-white text-[#0a0a0a]" : "bg-white/[0.08] text-white"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-white/[0.08] px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-white/40"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies — only shown while conversation is fresh */}
        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {QUICK_REPLIES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => send(r)}
                className="min-h-[36px] rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60 transition-colors hover:border-white/25 hover:text-white/90"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Hey, how much for monthly pool maintenance?"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 7L2 2l2.5 5L2 12l10-5z" fill="#0a0a0a" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a, adId }: { q: string; a: string; adId: string }) {
  const [open, setOpen] = useState(false);

  function toggle() {
    if (!open) posthog.capture("lp_faq_opened", { adId, question: q });
    setOpen((v) => !v);
  }

  return (
    <div className="border-b border-white/[0.06]">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between py-4 text-left min-h-[44px]"
      >
        <span className="pr-4 text-sm font-medium text-white">{q}</span>
        <span
          className={`shrink-0 text-white/40 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-white/50">{a}</p>
      )}
    </div>
  );
}

// ─── CTA button ───────────────────────────────────────────────────────────────

function CtaButton({ adId, label = "Claim my 60 days free →" }: { adId: string; label?: string }) {
  return (
    <a
      href={`/onboarding?from=lp_${adId}`}
      onClick={() => posthog.capture("lp_cta_clicked", { adId })}
      className="block w-full rounded-xl bg-white px-6 py-4 text-center text-base font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 active:opacity-80 min-h-[52px] flex items-center justify-center"
    >
      {label}
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEADLINE = new Date("2026-07-15T00:00:00");

function getDaysUntilDeadline(): number {
  const now = new Date();
  const diff = DEADLINE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function LpClient({ adId, h1, subtitle }: Props) {
  const [spotsLeft, setSpotsLeft] = useState<number>(47);
  const daysUntilDeadline = getDaysUntilDeadline();

  useEffect(() => {
    posthog.capture("lp_viewed", { adId });
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: { count?: number }) => {
        if (typeof d.count === "number") setSpotsLeft(Math.min(d.count, 99));
      })
      .catch(() => {});
  }, [adId]);

  return (
    <div className="overflow-x-hidden min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Header ── */}
      <header className="border-b border-zinc-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <rect x="12" y="12" width="48" height="48" rx="8" fill="none" stroke="#ffffff" strokeWidth="2.5" />
              <rect x="22" y="22" width="28" height="6" rx="1.5" fill="#ffffff" />
              <rect x="22" y="33" width="20" height="6" rx="1.5" fill="#ffffff" />
              <rect x="22" y="33" width="6" height="22" rx="1.5" fill="#ffffff" />
            </svg>
            <span className="text-lg font-semibold text-white">forgee</span>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          {/* Limited-time badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
              🎁 Limited time — 60 days free
            </span>
          </div>

          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            {h1}
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-white/55 md:text-lg">
            {subtitle}
          </p>

          {/* Social proof */}
          <div className="mb-8 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
            {["Live in 15 minutes", "60 days completely free", "Cancel in 2 clicks"].map(
              (item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-white/50">
                  <span className="font-semibold text-emerald-400">✓</span>
                  {item}
                </span>
              )
            )}
          </div>

          <div className="mx-auto max-w-xs">
            <CtaButton adId={adId} />
          </div>

          {/* Private beta pill */}
          <p className="mt-4 text-xs text-white/30">
            Private beta · {spotsLeft} of 100 spots filled
          </p>

          {/* ── Founder pricing card ── */}
          <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-left">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span className="text-sm font-semibold uppercase tracking-wide text-amber-400">
                Founder pricing — Locked until July 15 · {daysUntilDeadline} days left
              </span>
            </div>
            <p className="mb-4 text-sm text-zinc-300">
              Sign up before July 15, 2026 to lock today&apos;s pricing forever.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Starter", current: "$97", future: "$147" },
                { label: "Growth", current: "$297", future: "$397" },
                { label: "Agency", current: "$697", future: "$997" },
              ].map(({ label, current, future }) => (
                <div key={label}>
                  <div className="mb-1 text-xs text-zinc-500">{label}</div>
                  <div className="text-sm">
                    <span className="font-semibold text-white">{current}</span>
                    <span className="text-zinc-500"> → </span>
                    <span className="text-zinc-500 line-through">{future}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Live demo ── */}
      <section className="pb-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/30">
            Live demo
          </p>
          <h2 className="mb-8 text-xl font-semibold text-white md:text-2xl">
            Try Forgee live — type a message like a lead would:
          </h2>
          <LpDemo adId={adId} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-lg font-semibold text-white md:text-xl">Common questions</h2>
          {FAQ.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} adId={adId} />
          ))}
        </div>
      </section>

      {/* ── Founder story ── */}
      <section className="pb-16">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/30">
              Built by a founder, for founders
            </p>
            {/* Avatar */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white">
              T
            </div>
            <p className="mb-1 text-sm font-semibold text-white">Thomas Demers Ménard</p>
            <p className="mb-5 text-xs text-white/40">Founder of Forgee · Owner, Entretien Piscine Granby</p>
            <blockquote className="mb-6 text-sm leading-relaxed text-white/60 italic">
              "I run a pool maintenance business in Quebec. I was losing leads every night because I couldn't respond fast enough. So I built CHLORE — my own AI agent — and it changed everything. Now I'm sharing it with every service business that needs it. This is Forgee."
            </blockquote>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-xs font-medium text-emerald-400">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified business owner
            </div>
          </div>
        </div>
      </section>

      {/* ── Real conversation from CHLORE ── */}
      <section className="pb-16">
        <div className="mx-auto max-w-2xl px-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-white/30">
            Real conversation from CHLORE — built on Forgee
          </p>
          <p className="mb-6 text-center text-sm text-white/40">
            Closed $1,800 contract in 19 minutes. Zero human touch.
          </p>
          <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-6">
            <div className="space-y-3">
              {[
                { role: "lead", text: "Hey, how much for weekly pool maintenance?" },
                { role: "agent", text: "Hi! I'm CHLORE from Entretien Piscine Granby 👋 Weekly maintenance starts at $180/month and includes chemicals + equipment check. What size is your pool?" },
                { role: "lead", text: "It's a 20,000L in-ground, Granby area" },
                { role: "agent", text: "Perfect — that's our standard size. I can lock you in at $180/month for the full season (May–Oct). Want me to send you the contract right now?" },
                { role: "lead", text: "Yes please" },
                { role: "agent", text: "Sent! Check your email — it's a 2-minute e-sign. We'll confirm your first visit date once it's signed. 🎉" },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "lead" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "lead" ? "bg-white/[0.08] text-white" : "bg-white text-[#0a0a0a]"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-white/[0.06] pt-4 text-center text-xs text-zinc-500">
              Contract signed 19 min later · $1,800 season deal · No human involved
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/30">
            Start your 60-day free trial
          </p>
          <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">
            Ready to stop missing leads?
          </h2>
          <p className="mb-6 text-sm text-white/40">
            60-day free trial · No charge until day 61 · Cancel in 2 clicks
          </p>
          <div className="mx-auto max-w-xs">
            <CtaButton adId={adId} label="Claim my 60 days free →" />
          </div>
        </div>
      </section>
    </div>
  );
}
