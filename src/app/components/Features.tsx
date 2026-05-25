const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M14 6l2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Lead qualification",
    description:
      "Your agent asks the right questions, scores every lead, and only escalates the ones worth your time.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 8h14M7 4v4M13 4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Contract generation",
    description:
      "Auto-generate, send, and track service contracts from conversation data — no copy-pasting required.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 6V5a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="10" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
    title: "Payment collection",
    description:
      "Send invoices, collect deposits, and process recurring payments — all handled conversationally.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    title: "Route optimization",
    description:
      "Automatically schedule and route jobs to minimize drive time and maximize daily capacity.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3a7 7 0 1 0 0 14A7 7 0 0 0 10 3z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Automated reminders",
    description:
      "Appointment confirmations, follow-ups, and review requests sent at exactly the right moment.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 13V10M10 13V7M13 13V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Live analytics",
    description:
      "Real-time dashboards showing conversion rates, revenue per agent, and where deals are being lost.",
  },
];

export default function Features() {
  return (
    <section id="product" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 max-w-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
            Features
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Everything your business needs to run on autopilot
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-px border border-white/[0.06] bg-white/[0.06] md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 bg-[#0a0a0a] p-7 transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70">
                {feature.icon}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/40">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
