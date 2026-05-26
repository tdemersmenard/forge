"use client";

import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname();
  // Overview requires exact match; sub-pages use startsWith
  const isActive =
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <a
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-colors ${
        isActive ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"
      }`}
    >
      <span className={isActive ? "text-white" : "text-white/40"}>{icon}</span>
      {children}
    </a>
  );
}
