"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConvRow } from "./page";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}

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

interface Props {
  agentIds: string[];
  initialConversations: ConvRow[];
}

export function RealtimeOverview({ agentIds, initialConversations }: Props) {
  const [conversations, setConversations] =
    useState<ConvRow[]>(initialConversations);

  // Supabase Realtime subscription
  useEffect(() => {
    if (agentIds.length === 0) return;
    const supabase = createClient();

    const channel = supabase
      .channel("overview-conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const row = payload.new as ConvRow;
          if (!agentIds.includes(row.agent_id)) return;
          setConversations((prev) => [row, ...prev]);
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

  // Compute stats from current conversation state
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    const thisMonth = conversations.filter(
      (c) => c.created_at >= startOfMonth
    );

    const revenue = thisMonth.reduce((sum, c) => sum + (c.revenue ?? 0), 0);

    // Unique leads by phone
    const uniquePhones = new Set(
      thisMonth.map((c) => c.contact_phone).filter(Boolean)
    );
    const totalLeads = uniquePhones.size;

    // Latest status per phone
    const latestByPhone = new Map<string, ConvRow>();
    for (const c of thisMonth) {
      if (!c.contact_phone) continue;
      const existing = latestByPhone.get(c.contact_phone);
      if (!existing || c.created_at > existing.created_at) {
        latestByPhone.set(c.contact_phone, c);
      }
    }
    const closedCount = [...latestByPhone.values()].filter(
      (c) => c.status?.toLowerCase() === "closed"
    ).length;
    const autoClosedPct =
      totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0;

    return { revenue, totalLeads, autoClosedPct };
  }, [conversations]);

  // Recent activity: last 5 rows, all statuses, sorted desc
  const recentActivity = useMemo(
    () =>
      [...conversations]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5),
    [conversations]
  );

  return (
    <>
      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Revenue this month",
            value: `$${stats.revenue.toLocaleString()}`,
          },
          {
            label: "Leads this month",
            value: stats.totalLeads.toLocaleString(),
          },
          {
            label: "Auto-closed",
            value: `${stats.autoClosedPct}%`,
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

      {/* Recent activity */}
      <div className="rounded-xl border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Recent activity</h2>
          <a
            href="/dashboard/conversations"
            className="text-xs text-white/30 transition-colors hover:text-white/60"
          >
            View all →
          </a>
        </div>

        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="text-white/30"
              >
                <path
                  d="M9 2C5.1 2 2 4.7 2 8c0 1.8.8 3.4 2.1 4.5L3 16l3.4-1.5A7.5 7.5 0 0 0 9 15c3.9 0 7-2.7 7-6S12.9 2 9 2z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mb-1 text-sm font-medium text-white/50">
              No activity yet
            </p>
            <p className="text-xs text-white/25">
              Conversations will appear here in real time.
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
            {recentActivity.map((c) => (
              <a
                key={c.id}
                href="/dashboard/conversations"
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-medium text-white/50">
                    {c.contact_name
                      ? c.contact_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white/80">
                      {c.contact_name ?? c.contact_phone ?? "Unknown"}
                    </p>
                    <p className="truncate text-[11px] text-white/30">
                      {c.role === "agent" ? "Agent: " : "Lead: "}
                      {c.last_message ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle(c.status)}`}
                  >
                    {c.status ?? "new"}
                  </span>
                  <span className="text-[11px] text-white/25">
                    {formatTime(c.created_at)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
