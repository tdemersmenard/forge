"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
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

        <h1 className="mb-2 text-xl font-semibold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="mb-8 text-sm text-white/40">
          {t("haveAccount")}{" "}
          <a href="/login" className="text-white/70 underline underline-offset-4 hover:text-white">
            {t("signIn")}
          </a>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-white/50">
              {t("emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 focus:ring-0 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-white/50">
              {t("passwordLabel")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 focus:ring-0 transition-colors"
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-500/20 bg-red-500/[0.08] px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-10 rounded-md bg-white text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("creatingAccount") : t("createAccount")}
          </button>
        </form>

        <p className="mt-6 text-xs text-white/20 text-center">
          {t("terms")}
        </p>
      </div>
    </div>
  );
}
