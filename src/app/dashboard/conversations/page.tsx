import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationsClient } from "./ConversationsClient";
import type { ConvRow } from "../page";

export default async function ConversationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: agents } = await supabase.from("agents").select("id");
  const agentIds = (agents ?? []).map((a: { id: string }) => a.id);

  let initialConversations: ConvRow[] = [];
  if (agentIds.length > 0) {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .in("agent_id", agentIds)
      .order("created_at", { ascending: true })
      .limit(1000);
    initialConversations = (data as ConvRow[]) ?? [];
  }

  return (
    <ConversationsClient
      agentIds={agentIds}
      initialConversations={initialConversations}
    />
  );
}
