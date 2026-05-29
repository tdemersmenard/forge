"use client";

import { useTranslations } from "next-intl";

interface Props {
  email: string;
  showSuccess: boolean;
}

export function DashboardOverviewHeader({ email, showSuccess }: Props) {
  const t = useTranslations("dashboard");

  return (
    <>
      {showSuccess && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4">
          <span className="mt-0.5 text-lg leading-none">🎉</span>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              {t("agentActive")}
            </p>
            <p className="mt-0.5 text-xs text-emerald-400/70">
              {t("agentActiveDesc")}
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-white/40">
          {t("welcomeBack")}{" "}
          <span className="text-white/70">{email}</span>
        </p>
      </div>
    </>
  );
}
