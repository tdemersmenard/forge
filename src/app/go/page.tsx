import Link from "next/link";
import { GoPixel } from "./GoPixel";

export const metadata = {
  title: "Forgee — Your AI Agent for Service Businesses",
  description:
    "Deploy an AI agent on your phone number in 15 minutes. It responds to every lead 24/7 — qualifies, quotes, closes. Start your free 7-day trial.",
};

const BULLETS = [
  "Responds to leads in under 30 seconds",
  "Sends quotes and contracts automatically",
  "Collects payments via Stripe",
  "Works with Facebook Lead Ads out of the box",
];

const TESTIMONIALS = [
  {
    quote: "Closed $4,200 in my first week without touching my phone.",
    name: "Mike T.",
    role: "HVAC",
  },
  {
    quote: "My agent qualifies leads better than I ever did.",
    name: "Sarah L.",
    role: "Cleaning",
  },
  {
    quote: "Best $297 I spend every month. Pays for itself daily.",
    name: "David R.",
    role: "Landscaping",
  },
];

function CTAButton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Link
        href="/signup"
        className="block w-full max-w-sm rounded-xl bg-white px-8 py-4 text-center text-base font-bold text-black transition-opacity hover:opacity-90"
      >
        Start your free 7-day trial →
      </Link>
      <p className="text-xs text-white/30">No credit card required · Cancel anytime</p>
    </div>
  );
}

export default function GoPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16">

        <GoPixel />

        {/* 1. Logo */}
        <div className="mb-10">
          <span className="text-xl font-bold tracking-tight text-white">forgee</span>
        </div>

        {/* 2. Social proof bar */}
        <p className="mb-10 text-sm text-white/40">
          Join 200+ service businesses already on Forgee
        </p>

        {/* 3. Headline */}
        <h1 className="mb-5 text-center text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Your leads deserve a faster response than you can give.
        </h1>

        {/* 4. Subheadline */}
        <p className="mb-10 text-center text-base leading-relaxed text-white/55 sm:text-lg">
          Forgee deploys an AI agent on your phone number in 15 minutes.
          <br className="hidden sm:block" />
          It responds to every lead 24/7 — qualifies, quotes, closes.
          <br className="hidden sm:block" />
          While you sleep, work, or take a day off.
        </p>

        {/* 5. Bullets */}
        <ul className="mb-10 w-full max-w-sm space-y-3">
          {BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm text-white/75">
              <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
              {b}
            </li>
          ))}
        </ul>

        {/* 6. CTA */}
        <div className="mb-16 w-full">
          <CTAButton />
        </div>

        {/* 7. Testimonials */}
        <div className="mb-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <p className="mb-4 text-sm leading-relaxed text-white/70">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="text-xs font-semibold text-white/50">
                — {t.name},{" "}
                <span className="text-white/30">{t.role}</span>
              </p>
            </div>
          ))}
        </div>

        {/* 8. Repeat CTA */}
        <div className="mb-16 w-full">
          <CTAButton />
        </div>

        {/* 9. Footer */}
        <p className="text-xs text-white/20">© 2026 Forgee · forgee.app</p>
      </div>
    </div>
  );
}
