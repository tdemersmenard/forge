import { createClient } from "@/lib/supabase/server";
import { originGuard } from "@/lib/security";
import { z } from "zod";
import {
  IdentityUpdateSchema,
  ServicesUpdateSchema,
  QualificationUpdateSchema,
  PersonalityUpdateSchema,
  InstructionsUpdateSchema,
  TwilioUpdateSchema,
  FacebookUpdateSchema,
  NotificationsUpdateSchema,
} from "@/lib/schemas/agent";

// Map section name → zod schema
const SCHEMAS = {
  identity: IdentityUpdateSchema,
  services: ServicesUpdateSchema,
  qualification: QualificationUpdateSchema,
  personality: PersonalityUpdateSchema,
  instructions: InstructionsUpdateSchema,
  twilio: TwilioUpdateSchema,
  facebook: FacebookUpdateSchema,
  notifications: NotificationsUpdateSchema,
} as const;

type Section = keyof typeof SCHEMAS;

const RequestSchema = z.object({
  section: z.enum(Object.keys(SCHEMAS) as [Section, ...Section[]]),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  const originBlock = originGuard(request);
  if (originBlock) return originBlock;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request shape", details: parsed.error.format() }, { status: 400 });
  }

  const { section, data } = parsed.data;
  const schema = SCHEMAS[section];
  const dataParsed = schema.safeParse(data);
  if (!dataParsed.success) {
    return Response.json({ error: "Validation failed", details: dataParsed.error.format() }, { status: 400 });
  }

  // Update via user session (RLS + column-level grants enforced by Postgres)
  const { error } = await supabase
    .from("agents")
    .update(dataParsed.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("[agent/update] db error:", error.message);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }

  return Response.json({ success: true });
}
