"use client";

import { useEffect, useState } from "react";

const LS_KEY = "forgee_active_agent";

export function useActiveAgent(agentIds: string[]) {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const idsKey = agentIds.join(",");

  useEffect(() => {
    if (agentIds.length === 0) {
      setActiveAgentId(null);
      return;
    }
    const stored = localStorage.getItem(LS_KEY);
    const id = stored && agentIds.includes(stored) ? stored : agentIds[0];
    setActiveAgentId(id ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  function selectAgent(id: string) {
    localStorage.setItem(LS_KEY, id);
    setActiveAgentId(id);
  }

  return { activeAgentId, selectAgent };
}
