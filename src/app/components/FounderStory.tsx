"use client";

export default function FounderStory() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-2xl px-6">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/30">
            Built by a founder, for founders
          </p>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white">
            T
          </div>
          <p className="mb-1 text-sm font-semibold text-white">Thomas Demers Ménard</p>
          <p className="mb-5 text-xs text-white/40">
            Founder of Forgee · Owner, Entretien Piscine Granby
          </p>
          <blockquote className="mb-6 text-sm leading-relaxed text-white/60 italic">
            "I run a pool maintenance business in Quebec. I was losing leads every night because
            I couldn&apos;t respond fast enough. So I built CHLORE — my own AI agent — and it
            changed everything. Now I&apos;m sharing it with every service business that needs it.
            This is Forgee."
          </blockquote>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-xs font-medium text-emerald-400">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l2.5 2.5L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Verified business owner
          </div>
        </div>
      </div>
    </section>
  );
}
