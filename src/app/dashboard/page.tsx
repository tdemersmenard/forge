import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

type Conversation = {
  id: string;
  agent_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  last_message: string | null;
  status: string | null;
  revenue: number | null;
  created_at: string;
};

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="9" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    label: "Conversations",
    href: "/dashboard/conversations",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1C4 1 1 3.5 1 7c0 1.5.5 2.9 1.4 4L1 14l3.2-1.3A6.4 6.4 0 0 0 7.5 13c3.5 0 6.5-2.5 6.5-6S11 1 7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Leads",
    href: "/dashboard/leads",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1 13c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.1 1.1M11 11l1.1 1.1M2.9 12.1L4 11M11 4l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1 6.5h13" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 10h2M9 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

function statusStyle(status: string | null) {
  switch (status?.toLowerCase()) {
    case "closed":
      return "text-emerald-400 bg-emerald-400/10";
    case "in progress":
      return "text-blue-400 bg-blue-400/10";
    case "qualifying":
      return "text-amber-400 bg-amber-400/10";
    default:
      return "text-white/40 bg-white/[0.06]";
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch agents
  const { data: agents } = await supabase.from("agents").select("id");
  const agentIds = agents?.map((a: { id: string }) => a.id) ?? [];

  // Fetch conversations
  let conversations: Conversation[] = [];
  if (agentIds.length > 0) {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .in("agent_id", agentIds)
      .order("created_at", { ascending: false });
    conversations = (data as Conversation[]) ?? [];
  }

  // Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const revenueThisMonth = conversations
    .filter((c) => c.created_at >= startOfMonth)
    .reduce((sum, c) => sum + (c.revenue ?? 0), 0);
  const totalLeads = conversations.length;
  const closedCount = conversations.filter(
    (c) => c.status?.toLowerCase() === "closed"
  ).length;
  const autoClosedPct =
    totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0;

  const displayEmail = user.email ?? "your account";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[0.06] py-5 md:flex">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2 px-5">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2h4v4H2V2zM8 2h4v4H8V2zM2 8h4v4H2V8zM9 9l2 2-2 2"
                stroke="#0a0a0a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">Forge</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-colors ${
                item.href === "/dashboard"
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <span
                className={
                  item.href === "/dashboard" ? "text-white" : "text-white/40"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Agent status + logout */}
        <div className="px-5 pb-2">
          <div className="mb-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/50">
                Agent status
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {agentIds.length > 0 ? "Live" : "Idle"}
              </span>
            </div>
            <p className="text-[11px] text-white/30">
              {agentIds.length > 0
                ? `${agentIds.length} agent${agentIds.length > 1 ? "s" : ""} · ${totalLeads} handled`
                : "No agents yet"}
            </p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Overview</h1>
          <p className="mt-1 text-sm text-white/40">
            Welcome back,{" "}
            <span className="text-white/70">{displayEmail}</span>
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Revenue this month",
              value: `$${revenueThisMonth.toLocaleString()}`,
            },
            {
              label: "Leads handled",
              value: totalLeads.toLocaleString(),
            },
            {
              label: "Auto-closed",
              value: `${autoClosedPct}%`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <p className="mb-2 text-xs text-white/40">{stat.label}</p>
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Conversations */}
        <div className="rounded-xl border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Conversations</h2>
            {conversations.length > 0 && (
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/40">
                {conversations.length}
              </span>
            )}
          </div>

          {conversations.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="text-white/30"
                >
                  <path
                    d="M10 2C5.6 2 2 5.1 2 9c0 2 .9 3.8 2.3 5.1L3 17l3.2-1.4A8.5 8.5 0 0 0 10 16c4.4 0 8-3.1 8-7s-3.6-7-8-7z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="mb-1 text-sm font-medium text-white/60">
                No conversations yet
              </p>
              <p className="max-w-xs text-xs text-white/30">
                Once your agent starts talking to leads, conversations will
                appear here.
              </p>
              {agentIds.length === 0 && (
                <a
                  href="/onboarding"
                  className="mt-5 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
                >
                  Set up your first agent
                </a>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium text-white/60">
                      {c.contact_name
                        ? c.contact_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                        : "?"}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-white/80 truncate">
                        {c.contact_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-white/30 truncate">
                        {c.last_message ?? "No messages yet"}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-4">
                    {c.revenue != null && c.revenue > 0 && (
                      <span className="text-xs font-medium text-white/60">
                        ${c.revenue.toLocaleString()}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(
                        c.status
                      )}`}
                    >
                      {c.status ?? "Open"}
                    </span>
                    <span className="text-xs text-white/25">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
