"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import posthog from "posthog-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string };

interface Props {
  adId: string;
  h1: string;
  subtitle: string;
  video: string;
}

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
    q: "What happens after the 7-day trial?",
    a: "You'll get a reminder email 2 days before your trial ends. If you keep going, you're billed monthly. Nothing happens automatically without warning.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — 2 clicks from your billing page. No contracts, no penalties, no awkward cancellation calls. Your data stays available for 30 days after.",
  },
];

// ─── Demo component (self-contained, no next-intl dependency) ─────────────────

function LpDemo({ adId, onFirstMessage }: { adId: string; onFirstMessage: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! I'm Max from PoolPro 👋 Looking to get your pool cleaned or serviced?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const QUICK_REPLIES = ["Yes, I need a quote", "What's included?", "How much does it cost?"];

  async function send(text: string) {
    if (!text.trim() || loading) return;

    if (!hasTracked) {
      posthog.capture("lp_demo_used", { adId });
      onFirstMessage();
      setHasTracked(true);
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
      {/* Phone frame */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0f0f0f] shadow-2xl sm:rounded-[2rem]">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-[#0f0f0f] px-6 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-white">9:41</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm border border-white/40">
              <div className="h-full w-3/4 rounded-sm bg-white/60" />
            </div>
          </div>
        </div>

        {/* Agent header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#0f0f0f] px-4 py-3">
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
        <div className="flex h-64 flex-col gap-3 overflow-y-auto px-4 py-4 sm:h-72">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-white text-[#0a0a0a]"
                    : "bg-white/[0.08] text-white"
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
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
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
            placeholder="Type a message like a lead would…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M12 7L2 2l2.5 5L2 12l10-5z"
                fill="#0a0a0a"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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

function CtaButton({ adId, label = "Build my agent — Free" }: { adId: string; label?: string }) {
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

export function LpClient({ adId, h1, subtitle, video }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrackedRef = useRef(false);

  useEffect(() => {
    posthog.capture("lp_viewed", { adId });
  }, [adId]);

  const handleVideoPlay = useCallback(() => {
    if (videoTrackedRef.current) return;
    videoTrackedRef.current = true;
    posthog.capture("lp_video_played", { adId });
  }, [adId]);

  return (
    <div className="overflow-x-hidden min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Header ── */}
      <header className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4 md:h-16 md:px-8">
        <img src="/logo.svg" alt="Forgee" height="24" />
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="text-xs font-medium text-white/60 transition-colors hover:text-white"
          >
            Sign in
          </a>
          <a
            href={`/onboarding?from=lp_${adId}`}
            onClick={() => posthog.capture("lp_cta_clicked", { adId, position: "nav" })}
            className="hidden rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 md:block"
          >
            Get started free
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-4 pb-10 pt-8 text-center md:px-8 md:pb-14 md:pt-12">
        <h1 className="mb-4 text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          {h1}
        </h1>
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-white/55 md:text-lg">
          {subtitle}
        </p>

        {/* Social proof pills */}
        <div className="mb-8 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-2">
          {["Live in 15 minutes", "7-day free trial — no charge", "Cancel in 2 clicks"].map(
            (item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm text-white/50">
                <span className="font-semibold text-emerald-400">✓</span>
                {item}
              </span>
            )
          )}
        </div>

        <div className="mx-auto max-w-sm">
          <CtaButton adId={adId} />
        </div>
      </section>

      {/* ── Video ── */}
      <section className="px-4 pb-10 md:px-8">
        <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl">
          <video
            ref={videoRef}
            src={video}
            autoPlay
            muted
            loop
            playsInline
            onPlay={handleVideoPlay}
            className="aspect-[9/16] w-full object-cover"
            aria-label="Product demo video"
          />
        </div>
      </section>

      {/* ── Live demo ── */}
      <section className="px-4 pb-12 md:px-8">
        <div className="mx-auto max-w-[480px]">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-white/30">
            Live demo
          </p>
          <h2 className="mb-6 text-center text-xl font-semibold text-white">
            Try Forgee live — type a message like a lead would:
          </h2>
          <LpDemo adId={adId} onFirstMessage={() => {}} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 pb-12 md:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Common questions</h2>
          {FAQ.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} adId={adId} />
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-4 pb-16 md:px-8">
        <div className="mx-auto max-w-sm text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/30">
            Start your free trial
          </p>
          <h2 className="mb-6 text-2xl font-bold text-white">
            Ready to stop missing leads?
          </h2>
          <CtaButton adId={adId} label="Build my agent — Free →" />
          <p className="mt-3 text-xs text-white/25">No credit card charged for 7 days.</p>
        </div>
      </section>
    </div>
  );
}
