"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "Hey! I'm Max from PoolPro 👋 Looking to get your pool cleaned or serviced?",
  },
];

const QUICK_REPLIES = [
  "Yes, I need a quote",
  "What's included?",
  "How much does it cost?",
];

export default function LiveDemo() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStarted(true);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json() as { reply?: string; error?: string };
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
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left: copy */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
              Live demo
            </p>
            <h2 className="mb-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Talk to a real agent.
              <br />
              <span className="text-white/40">Right now.</span>
            </h2>
            <p className="mb-8 text-base leading-relaxed text-white/40">
              This is an actual Forgee agent — same AI, same logic your
              customers will experience. Ask it anything a pool lead would ask.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Qualifies you with smart follow-up questions",
                "Gives ballpark pricing on the spot",
                "Moves toward booking an assessment",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-white/50">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-emerald-400">
                    <path d="M2.5 7l3.5 3.5 5.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: phone mockup */}
          <div className="flex justify-center">
            <div className="relative w-[320px]">
              {/* Phone frame */}
              <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#111] shadow-2xl shadow-black/60">
                {/* Status bar */}
                <div className="flex items-center justify-between bg-[#111] px-6 pb-1 pt-3">
                  <span className="text-[11px] font-medium text-white/60">9:41</span>
                  <div className="h-4 w-24 rounded-full bg-black" />
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full border border-white/30" />
                    <div className="h-2.5 w-3.5 rounded-sm border border-white/30" />
                  </div>
                </div>

                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#111] px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-semibold text-emerald-400">
                    M
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Max · PoolPro</p>
                    <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Online
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex h-72 flex-col gap-3 overflow-y-auto bg-[#0d0d0d] p-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            msg.role === "user"
                              ? "rounded-br-sm bg-white text-[#0a0a0a]"
                              : "rounded-bl-sm bg-white/[0.06] text-white/80"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white/[0.06] px-4 py-3">
                          {[0, 1, 2].map((dot) => (
                            <motion.div
                              key={dot}
                              className="h-1.5 w-1.5 rounded-full bg-white/40"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {/* Quick replies */}
                {!started && (
                  <div className="flex flex-wrap gap-2 bg-[#0d0d0d] px-3 pb-2">
                    {QUICK_REPLIES.map((r) => (
                      <button
                        key={r}
                        onClick={() => sendMessage(r)}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex items-center gap-2 border-t border-white/[0.06] bg-[#111] px-3 py-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                    placeholder="Type a message…"
                    className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/20 outline-none"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-30"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Glow */}
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[3rem] bg-emerald-400/[0.03] blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
