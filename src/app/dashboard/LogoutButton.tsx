"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations("sidebar");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-white/40 transition-colors hover:text-white/70"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9.5 10l3-3-3-3M12.5 7H5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {t("logout")}
    </button>
  );
}
