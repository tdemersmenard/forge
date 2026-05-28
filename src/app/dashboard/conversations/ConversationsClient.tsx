"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConvRow } from "../page";

type Thread = {
  phone: string;
  name: string | null;
  messages: ConvRow[];
  lastMessage: ConvRow;
};

function sourceLabel(source: string | null) {
  return source === "facebook" ? "Facebook Ad" : "SMS";
}

function sourceBadgeStyle(source: string | null) {
  return source === "facebook"
    ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
    : "text-white/30 bg-white/[0.04] border-white/[0.08]";
}

function statusStyle(status: string | null) {
  switch (status?.toLowerCase()) {
    case "closed":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "in_progress":
    case "in progress":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "qualifying":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    default:
      return "text-white/40 bg-white/[0.05] border-white/10";
  }
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null, phone: string) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return phone.slice(-2);
}

interface Props {
  agentIds: string[];
  initialConversations: ConvRow[];
}

export function ConversationsClient({ agentIds, initialConversations }: Props) {
  const [conversations, setConversations] =
    useState<ConvRow[]>(initialConversations);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Realtime subscription
  useEffect(() => {
    if (agentIds.length === 0) return;
    const supabase = createClient();

    const channel = supabase
      .channel("conversations-chat")
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

  // Group by contact_phone into threads
  const threads = useMemo<Thread[]>(() => {
    const byPhone = new Map<string, ConvRow[]>();
    for (const row of conversations) {
      const phone = row.contact_phone ?? "unknown";
      if (!byPhone.has(phone)) byPhone.set(phone, []);
      byPhone.get(phone)!.push(row);
    }

    const result: Thread[] = [];
    for (const [phone, rows] of byPhone.entries()) {
      const sorted = [...rows].sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      );
      result.push({
        phone,
        name: rows.find((r) => r.contact_name)?.contact_name ?? null,
        messages: sorted,
        lastMessage: sorted[sorted.length - 1],
      });
    }

    return result.sort((a, b) =>
      b.lastMessage.created_at.localeCompare(a.lastMessage.created_at)
    );
  }, [conversations]);

  // Auto-select first thread on load
  useEffect(() => {
    if (threads.length > 0 && selectedPhone === null) {
      setSelectedPhone(threads[0].phone);
    }
  }, [threads, selectedPhone]);

  // Auto-scroll to bottom when messages update
  const selectedThread = threads.find((t) => t.phone === selectedPhone);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.messages.length]);

  if (agentIds.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-white/60">
            No agent configured
          </p>
          <a
            href="/onboarding"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            Set up your agent
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 overflow-hidden">
      {/* Contact list */}
      <div className="flex w-72 shrink-0 flex-col border-r border-white/[0.06]">
        <div className="border-b border-white/[0.06] px-4 py-3.5">
          <h2 className="text-sm font-semibold text-white">Conversations</h2>
          <p className="mt-0.5 text-xs text-white/30">
            {threads.length} thread{threads.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <p className="text-xs text-white/30">No conversations yet</p>
            </div>
          ) : (
            threads.map((thread) => {
              const isActive = selectedPhone === thread.phone;
              const latestStatus = thread.lastMessage.status;
              return (
                <button
                  key={thread.phone}
                  onClick={() => setSelectedPhone(thread.phone)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-medium text-white/60">
                    {initials(thread.name, thread.phone)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-white/90">
                        {thread.name ?? thread.phone}
                      </span>
                      <span className="shrink-0 text-[10px] text-white/25">
                        {formatTimestamp(thread.lastMessage.created_at)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] text-white/35">
                        {thread.lastMessage.last_message ?? "—"}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <span
                          className={`rounded-full border px-1.5 py-px text-[10px] font-medium ${sourceBadgeStyle(thread.lastMessage.source)}`}
                        >
                          {sourceLabel(thread.lastMessage.source)}
                        </span>
                        <span
                          className={`rounded-full border px-1.5 py-px text-[10px] font-medium ${statusStyle(latestStatus)}`}
                        >
                          {latestStatus ?? "new"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedThread ? (
          <>
            {/* Thread header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedThread.name ?? selectedThread.phone}
                </p>
                {selectedThread.name && (
                  <p className="text-xs text-white/30">{selectedThread.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${sourceBadgeStyle(selectedThread.lastMessage.source)}`}
                >
                  {sourceLabel(selectedThread.lastMessage.source)}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(
                    selectedThread.lastMessage.status
                  )}`}
                >
                  {selectedThread.lastMessage.status ?? "new"}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-3">
                {selectedThread.messages.map((msg) => {
                  const isAgent = msg.role === "agent";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isAgent
                            ? "rounded-br-sm bg-white/[0.12] text-white"
                            : "rounded-bl-sm bg-white/[0.06] text-white/80"
                        }`}
                      >
                        {msg.last_message ?? ""}
                      </div>
                      <span className="mt-1 text-[10px] text-white/20">
                        {isAgent ? "Agent · " : "Lead · "}
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-white/25">Select a conversation</p>
          </div>
        )}
      </div>
    </main>
  );
}
