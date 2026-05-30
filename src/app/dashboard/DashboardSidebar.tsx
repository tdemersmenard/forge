"use client";

import { useTranslations } from "next-intl";
import { NavLink } from "./NavLink";
import { LogoutButton } from "./LogoutButton";
import { LanguageToggle } from "@/app/components/LanguageToggle";

interface Props {
  agentCount: number;
}

export function DashboardSidebar({ agentCount }: Props) {
  const t = useTranslations("sidebar");

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
      href: "/dashboard/settings",
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

  const agentStatusText =
    agentCount === 0
      ? t("noAgents")
      : agentCount === 1
      ? t("agentConfigured", { count: agentCount })
      : t("agentsConfigured", { count: agentCount });

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[0.06] py-5 md:flex">
      {/* Logo */}
      <div className="mb-6 px-5">
        <img src="/logo.svg" alt="Forgee" height="28" />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Agent status + lang + logout */}
      <div className="px-5 pb-2">
        <div className="mb-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-medium text-white/50">
              {t("agentStatus")}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {agentCount > 0 ? t("live") : t("idle")}
            </span>
          </div>
          <p className="text-[11px] text-white/30">{agentStatusText}</p>
        </div>
        <div className="mb-2 flex justify-start px-1">
          <LanguageToggle />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
