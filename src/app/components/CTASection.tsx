import Link from "next/link";

export default function CTASection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-20 text-center">
          <h2 className="mx-auto mb-6 max-w-lg text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Your agent is ready.
            <br />
            Are you?
          </h2>
          <p className="mx-auto mb-10 max-w-sm text-base text-white/40">
            Get live in 15 minutes. No code. No sales calls. Just a form and your first agent.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
            >
              Start for free
            </Link>
            <a
              href="#"
              className="inline-flex h-11 items-center justify-center text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Talk to a human instead &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
