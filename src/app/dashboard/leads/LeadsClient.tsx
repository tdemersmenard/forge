"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { ConvRow } from "../page";

type Lead = {
  phone: string;
  name: string | null;
  email: string | null;
  status: string | null;
  revenue: number;
  firstContact: string;
  lastActivity: string;
  messageCount: number;
};

type StatusFilter = "all" | "new" | "qualifying" | "in_progress" | "closed";

const STATUS_FILTER_KEYS: StatusFilter[] = ["all", "new", "qualifying", "in_progress", "closed"];

function statusStyle(status: string | null) {
  switch (status?.toLowerCase()) {
    case "closed":
      return "text-emerald-400 bg-emerald-400/10";
    case "in_progress":
    case "in progress":
      return "text-blue-400 bg-blue-400/10";
    case "qualifying":
      return "text-amber-400 bg-amber-400/10";
    default:
      return "text-white/40 bg-white/[0.06]";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupIntoLeads(conversations: ConvRow[]): Lead[] {
  const byPhone = new Map<string, ConvRow[]>();
  for (const row of conversations) {
    const phone = row.contact_phone ?? "unknown";
    if (!byPhone.has(phone)) byPhone.set(phone, []);
    byPhone.get(phone)!.push(row);
  }

  return [...byPhone.entries()].map(([phone, rows]) => {
    const sorted = [...rows].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
    const latest = sorted[sorted.length - 1];
    return {
      phone,
      name: rows.find((r) => r.contact_name)?.contact_name ?? null,
      email: rows.find((r) => r.contact_email)?.contact_email ?? null,
      status: latest.status,
      revenue: rows.reduce((sum, r) => sum + (r.revenue ?? 0), 0),
      firstContact: sorted[0].created_at,
      lastActivity: latest.created_at,
      messageCount: rows.length,
    };
  });
}

interface Props {
  agentIds: string[];
  initialConversations: ConvRow[];
}

type AddLeadForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  note: string;
};

const EMPTY_FORM: AddLeadForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  note: "",
};

export function LeadsClient({ agentIds, initialConversations }: Props) {
  const t = useTranslations("leads");
  const [conversations, setConversations] =
    useState<ConvRow[]>(initialConversations);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddLeadForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Realtime subscription
  useEffect(() => {
    if (agentIds.length === 0) return;
    const supabase = createClient();

    const channel = supabase
      .channel("leads-conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const row = payload.new as ConvRow;
          if (!agentIds.includes(row.agent_id)) return;
          setConversations((prev) => [...prev, row]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const row = payload.new as ConvRow;
          if (!agentIds.includes(row.agent_id)) return;
          setConversations((prev) =>
            prev.map((c) => (c.id === row.id ? row : c))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentIds]);

  // Focus first input when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [showModal]);

  function openModal() {
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || undefined,
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          note: form.note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? t("toastError"));
      } else {
        toast.success(t("toastSuccess"));
        closeModal();
      }
    } catch {
      toast.error(t("toastNetwork"));
    } finally {
      setSubmitting(false);
    }
  }

  const leads = useMemo(
    () =>
      groupIntoLeads(conversations).sort((a, b) =>
        b.lastActivity.localeCompare(a.lastActivity)
      ),
    [conversations]
  );

  // Summary stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const leadsThisMonth = useMemo(
    () => leads.filter((l) => l.lastActivity >= startOfMonth),
    [leads, startOfMonth]
  );
  const totalRevenue = useMemo(
    () => leads.reduce((sum, l) => sum + l.revenue, 0),
    [leads]
  );
  const closedLeads = useMemo(
    () => leads.filter((l) => l.status?.toLowerCase() === "closed").length,
    [leads]
  );
  const conversionRate = useMemo(
    () =>
      leads.length > 0
        ? Math.round((closedLeads / leads.length) * 100)
        : 0,
    [leads, closedLeads]
  );

  // Filter + search
  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter !== "all") {
      result = result.filter((l) => {
        const s = l.status?.toLowerCase().replace(" ", "_") ?? "new";
        return s === statusFilter;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) || l.phone.includes(q)
      );
    }
    return result;
  }, [leads, statusFilter, search]);

  return (
    <main className="flex-1 overflow-auto px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-white/40">{t("subtitle")}</p>
        </div>
        <button
          onClick={openModal}
          className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
        >
          {t("addLead")}
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: t("totalLeads"),
            value: leads.length.toLocaleString(),
          },
          {
            label: t("conversionRate"),
            value: `${conversionRate}%`,
          },
          {
            label: t("revenueThisMonth"),
            value: `$${leadsThisMonth
              .reduce((sum, l) => sum + l.revenue, 0)
              .toLocaleString()}`,
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

      {/* Filters + search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
          {STATUS_FILTER_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === key
                  ? "bg-white text-[#0a0a0a]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t(key === "in_progress" ? "inProgress" : key)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-colors sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.08]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="mb-1 text-sm font-medium text-white/50">
              {leads.length === 0 ? t("noLeads") : t("noResults")}
            </p>
            <p className="text-xs text-white/25">
              {leads.length === 0 ? t("noLeadsDesc") : t("noResultsDesc")}
            </p>
            {leads.length === 0 && agentIds.length === 0 && (
              <a
                href="/onboarding"
                className="mt-5 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
              >
                {t("setupAgent")}
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    t("name"),
                    t("phone"),
                    t("status"),
                    t("revenue"),
                    t("firstContact"),
                    t("lastActivity"),
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white/30"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((lead) => (
                  <tr
                    key={lead.phone}
                    className="group transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-medium text-white/50">
                          {lead.name
                            ? lead.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : lead.phone.slice(-2)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/80">
                            {lead.name ?? "—"}
                          </p>
                          {lead.email && (
                            <p className="text-[11px] text-white/30">
                              {lead.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-white/50">
                      {lead.phone}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(lead.status)}`}
                      >
                        {lead.status ?? "new"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/60">
                      {lead.revenue > 0
                        ? `$${lead.revenue.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/40">
                      {formatDate(lead.firstContact)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">
                          {formatDate(lead.lastActivity)}
                        </span>
                        <a
                          href="/dashboard/conversations"
                          className="ml-3 hidden rounded px-2 py-1 text-[11px] text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70 group-hover:block"
                        >
                          {t("viewArrow")}
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-white/[0.04] px-5 py-3">
              <p className="text-xs text-white/25">
                {filtered.length === 1 ? t("leadCount", { count: filtered.length }) : t("leadsCount", { count: filtered.length })}
                {(statusFilter !== "all" || search) ? ` ${t("total", { count: leads.length })}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {totalRevenue > 0 && (
        <p className="mt-3 text-right text-xs text-white/25">
          {t("totalRevenue")} ${totalRevenue.toLocaleString()}
        </p>
      )}

      {/* Add lead modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{t("modal.title")}</h2>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-white/30 transition-colors hover:text-white/70"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs text-white/50">
                    {t("modal.firstName")} <span className="text-white/30">{t("modal.required")}</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder={t("modal.firstNamePlaceholder")}
                    className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-white/50">{t("modal.lastName")}</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder={t("modal.lastNamePlaceholder")}
                    className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/50">
                  {t("modal.phone")} <span className="text-white/30">{t("modal.required")}</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder={t("modal.phonePlaceholder")}
                  className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t("modal.email")}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={t("modal.emailPlaceholder")}
                  className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t("modal.note")}</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder={t("modal.notePlaceholder")}
                  rows={3}
                  className="w-full resize-none rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
                >
                  {t("modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.firstName.trim() || !form.phone.trim()}
                  className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? t("modal.submitting") : t("modal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
