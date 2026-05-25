const plans = [
  {
    name: "Starter",
    price: "$97",
    period: "/mo",
    description: "For solo operators getting their first agent live.",
    features: [
      "1 AI agent",
      "Up to 500 conversations/mo",
      "Lead qualification",
      "Email notifications",
      "Basic analytics",
      "Email support",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$297",
    period: "/mo",
    description: "For growing teams that need full automation.",
    features: [
      "5 AI agents",
      "Unlimited conversations",
      "Contract generation",
      "Payment collection",
      "Route optimization",
      "Priority support",
    ],
    cta: "Get started",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Agency",
    price: "$697",
    period: "/mo",
    description: "For agencies managing multiple client accounts.",
    features: [
      "Unlimited agents",
      "Unlimited conversations",
      "White-label branding",
      "Client dashboards",
      "API access",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
            Pricing
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Simple, predictable pricing
          </h2>
          <p className="mt-4 text-sm text-white/40">
            No per-conversation fees. No surprises. Cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl p-7 ${
                plan.highlighted
                  ? "bg-white text-[#0a0a0a]"
                  : "border border-white/[0.08] bg-white/[0.02]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#0a0a0a] px-3 py-1 text-xs font-medium text-white border border-white/10">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <p className={`mb-4 text-sm font-semibold ${plan.highlighted ? "text-[#0a0a0a]" : "text-white"}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-semibold tracking-tight ${plan.highlighted ? "text-[#0a0a0a]" : "text-white"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-[#0a0a0a]/60" : "text-white/40"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`mt-3 text-sm ${plan.highlighted ? "text-[#0a0a0a]/60" : "text-white/40"}`}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="mb-8 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className={plan.highlighted ? "text-[#0a0a0a]" : "text-white/50"}
                    >
                      <path
                        d="M2.5 7l3.5 3.5 5.5-7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className={`text-sm ${plan.highlighted ? "text-[#0a0a0a]/80" : "text-white/50"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#"
                className={`mt-auto block rounded-md py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                  plan.highlighted
                    ? "bg-[#0a0a0a] text-white"
                    : "border border-white/10 text-white hover:border-white/20"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
