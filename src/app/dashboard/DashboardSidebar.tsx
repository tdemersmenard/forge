"use client";

import { useTranslations } from "next-intl";
import { NavLink } from "./NavLink";
import { LogoutButton } from "./LogoutButton";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { useActiveAgent } from "@/lib/useActiveAgent";

type AgentInfo = {
  id: string;
  agent_name: string | null;
  business_name: string;
  sector: string | null;
  phone: string | null;
  plan: string | null;
  plan_status: string | null;
};

interface Props {
  agents: AgentInfo[];
}

function getAgentLimit(plan: string | null): number | null {
  if (plan === "agency") return null;
  if (plan === "growth") return 3;
  return 1;
}

export function DashboardSidebar({ agents }: Props) {
  const t = useTranslations("sidebar");
  const agentIds = agents.map((a) => a.id);
  const { activeAgentId, selectAgent } = useActiveAgent(agentIds);

  const currentPlan = agents[0]?.plan ?? null;
  const agentLimit = getAgentLimit(currentPlan);
  const canAddAgent = agentLimit === null || agents.length < agentLimit;

  const settingsHref = activeAgentId
    ? `/dashboard/settings?agent=${activeAgentId}`
    : "/dashboard/settings";

  const navItems = [
    {
      label: t("overview"),
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
      label: t("conversations"),
      href: "/dashboard/conversations",
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M7.5 1C4 1 1 3.5 1 7c0 1.5.5 2.9 1.4 4L1 14l3.2-1.3A6.4 6.4 0 0 0 7.5 13c3.5 0 6.5-2.5 6.5-6S11 1 7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: t("leads"),
      href: "/dashboard/leads",
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 13c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: t("settings"),
      href: settingsHref,
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.1 1.1M11 11l1.1 1.1M2.9 12.1L4 11M11 4l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: t("billing"),
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

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[0.06] py-5 md:flex">
      {/* Logo */}
      <div className="mb-5 px-5">
        <img src="/logo.svg" alt="Forgee" height="28" />
      </div>

      {/* Agents section */}
      <div className="mb-2 px-3">
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Agents
          </span>
          {canAddAgent && agents.length > 0 && (
            <a
              href="/dashboard/agents/new"
              className="text-[10px] text-white/30 transition-colors hover:text-white/70"
            >
              + New
            </a>
          )}
        </div>

        {agents.length === 0 ? (
          <a
            href="/onboarding"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/30 transition-colors hover:text-white/60"
          >
            <span className="text-white/20">+</span> Set up your agent
          </a>
        ) : (
          agents.map((agent) => {
            const isActive = activeAgentId === agent.id;
            const name = agent.agent_name ?? agent.business_name;
            const isLive = !!agent.phone;
            return (
              <button
                key={agent.id}
                onClick={() => selectAgent(agent.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isLive ? "bg-emerald-400" : "bg-white/20"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium leading-tight">{name}</p>
                  {agent.sector && (
                    <p className="truncate text-[10px] capitalize leading-tight text-white/30">
                      {agent.sector}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}

        {!canAddAgent && (
          <a
            href="/dashboard/billing"
            className="mt-1 block px-2 text-[10px] text-white/25 transition-colors hover:text-white/50"
          >
            Upgrade to add more agents →
          </a>
        )}
      </div>

      <div className="mb-3 mx-5 border-t border-white/[0.04]" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: lang + logout */}
      <div className="px-5 pb-2">
        <div className="mb-2 flex justify-start px-1">
          <LanguageToggle />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
