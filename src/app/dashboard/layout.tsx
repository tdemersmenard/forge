import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: agents } = await supabase.from("agents").select("id");
  const agentCount = agents?.length ?? 0;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <DashboardSidebar agentCount={agentCount} />
      {children}
    </div>
  );
}
