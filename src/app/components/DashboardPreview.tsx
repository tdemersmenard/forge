const statCards = [
  { label: "Revenue (30d)", value: "$24,180", change: "+12.4%", up: true },
  { label: "Leads qualified", value: "847", change: "+8.1%", up: true },
  { label: "Auto-closed", value: "73%", change: "+5.2%", up: true },
];

const conversations = [
  {
    name: "Sarah Mitchell",
    topic: "Roofing estimate — 3,200 sqft",
    time: "2m ago",
    status: "Qualifying",
    statusColor: "text-amber-400 bg-amber-400/10",
  },
  {
    name: "James Ortega",
    topic: "HVAC service contract renewal",
    time: "14m ago",
    status: "In progress",
    statusColor: "text-blue-400 bg-blue-400/10",
  },
  {
    name: "Dana Pruitt",
    topic: "Landscaping weekly — $380/mo",
    time: "1h ago",
    status: "Closed",
    statusColor: "text-emerald-400 bg-emerald-400/10",
  },
];

const navItems = [
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="9" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    label: "Dashboard",
    active: true,
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1C4 1 1 3.5 1 7c0 1.5.5 2.9 1.4 4L1 14l3.2-1.3A6.4 6.4 0 0 0 7.5 13c3.5 0 6.5-2.5 6.5-6S11 1 7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
    label: "Conversations",
    active: false,
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1 13c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    label: "Leads",
    active: false,
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M1 4h13M1 8h8M1 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    label: "Analytics",
    active: false,
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7.5 4v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    label: "Settings",
    active: false,
  },
];

export default function DashboardPreview() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-white/30">
            Your agent in action
          </p>
        </div>

        {/* Browser chrome */}
        <div className="overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl shadow-black/60">
          {/* Browser bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#111111] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
            </div>
            <div className="mx-auto flex h-6 items-center rounded border border-white/[0.06] bg-white/[0.04] px-3">
              <span className="text-xs text-white/30">app.forge.ai/dashboard</span>
            </div>
          </div>

          {/* App layout */}
          <div className="flex bg-[#0d0d0d]" style={{ minHeight: "460px" }}>
            {/* Sidebar */}
            <div className="hidden w-52 shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0d0d] py-5 md:flex">
              {/* Logo */}
              <div className="mb-6 px-5">
                <img src="/logo.svg" alt="Forgee" height="22" />
              </div>

              {/* Nav items */}
              <nav className="flex flex-col gap-0.5 px-2">
                {navItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs cursor-pointer transition-colors ${
                      item.active
                        ? "bg-white/[0.08] text-white"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    <span className={item.active ? "text-white" : "text-white/40"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                ))}
              </nav>

              {/* Agent status */}
              <div className="mt-auto px-5">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white/50">Agent status</span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Live
                    </span>
                  </div>
                  <div className="text-[11px] text-white/30">Running · 847 handled</div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden p-6">
              {/* Page header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Dashboard</h2>
                  <p className="text-xs text-white/30">May 24, 2026</p>
                </div>
                <button className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-[#0a0a0a]">
                  New agent
                </button>
              </div>

              {/* Stat cards */}
              <div className="mb-6 grid grid-cols-3 gap-3">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4"
                  >
                    <p className="mb-2 text-[11px] text-white/40">{card.label}</p>
                    <p className="text-xl font-semibold text-white">{card.value}</p>
                    <p className={`mt-1 text-[11px] font-medium ${card.up ? "text-emerald-400" : "text-red-400"}`}>
                      {card.change}
                    </p>
                  </div>
                ))}
              </div>

              {/* Conversations */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <span className="text-xs font-medium text-white/70">Live conversations</span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/40">
                    {conversations.length} active
                  </span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {conversations.map((c) => (
                    <div key={c.name} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-medium text-white/60">
                          {c.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-medium text-white/80 truncate">{c.name}</p>
                          <p className="text-[11px] text-white/30 truncate">{c.topic}</p>
                        </div>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-3">
                        <span className="text-[11px] text-white/25">{c.time}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.statusColor}`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
