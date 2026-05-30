import { z } from "zod";

// ── Helpers ─────────────────────────────────────────────────────────────────

const trimmedString = (max: number) =>
  z.string().trim().max(max);

const phoneE164 = z.string().regex(
  /^\+[1-9]\d{1,14}$/,
  "Phone must be in E.164 format (e.g. +15551234567)"
);

// ── Reusable sub-schemas ────────────────────────────────────────────────────

export const ServiceItemSchema = z.object({
  name: trimmedString(120).min(1),
  price: trimmedString(40),
  unit: z.enum(["fixed", "per visit", "per sqft", "custom"]),
});

export const BusinessHoursSchema = z.object({
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  days: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).max(7),
});

export const NotificationsPrefsSchema = z.object({
  new_lead: z.boolean(),
  deal_closed: z.boolean(),
});

// ── Per-section update schemas ──────────────────────────────────────────────

export const IdentityUpdateSchema = z.object({
  agent_name: trimmedString(60).min(1),
  business_name: trimmedString(120).min(1),
  sector: z.enum(["pool", "lawn", "cleaning", "hvac", "construction", "other"]),
});

export const ServicesUpdateSchema = z.object({
  services_list: z.array(ServiceItemSchema).max(10),
  services: trimmedString(2000),
  contract_value: z.enum(["Under $500", "$500–$2,000", "$2,000–$5,000", "$5,000+", ""]).optional(),
});

export const QualificationUpdateSchema = z.object({
  qualification_questions: z.array(trimmedString(300)).max(8),
  disqualification_criteria: trimmedString(1000).nullable(),
});

export const PersonalityUpdateSchema = z.object({
  tone: z.enum(["professional", "friendly", "direct"]),
  language: z.enum(["FR", "EN"]),
  bilingual: z.boolean(),
  business_hours: BusinessHoursSchema,
});

export const InstructionsUpdateSchema = z.object({
  service_area: trimmedString(500).nullable(),
  promotions: trimmedString(1000).nullable(),
  never_say: trimmedString(1000).nullable(),
  escalation_criteria: trimmedString(1000).nullable(),
});

export const TwilioUpdateSchema = z.object({
  phone: z.union([phoneE164, z.literal("")]),
  twilio_account_sid: z.union([
    z.string().regex(/^AC[a-zA-Z0-9]{32}$/, "Invalid Twilio Account SID format"),
    z.literal(""),
  ]),
  twilio_auth_token: trimmedString(64).optional(), // omitted = keep existing value
});

export const FacebookUpdateSchema = z.object({
  facebook_page_id: trimmedString(40),
  facebook_access_token: trimmedString(500).optional(), // omitted = keep existing value
  facebook_verify_token: trimmedString(100).optional(), // omitted = keep existing value
});

export const NotificationsUpdateSchema = z.object({
  notifications_prefs: NotificationsPrefsSchema,
});

// ── Full agent create (used at signup) ──────────────────────────────────────

export const AgentCreateSchema = z.object({
  agent_name: trimmedString(60).min(1),
  business_name: trimmedString(120).min(1),
  sector: z.string().max(40),
  services_list: z.array(ServiceItemSchema).max(10).optional(),
  services: trimmedString(2000).optional(),
  contract_value: trimmedString(40).optional(),
  qualification_questions: z.array(trimmedString(300)).max(8).optional(),
  disqualification_criteria: trimmedString(1000).nullable().optional(),
  tone: trimmedString(40).optional(),
  language: z.enum(["FR", "EN"]).optional(),
  bilingual: z.boolean().optional(),
  business_hours: BusinessHoursSchema.optional(),
  service_area: trimmedString(500).nullable().optional(),
  promotions: trimmedString(1000).nullable().optional(),
  never_say: trimmedString(1000).nullable().optional(),
  escalation_criteria: trimmedString(1000).nullable().optional(),
  twilio_account_sid: trimmedString(64).nullable().optional(),
  twilio_auth_token: trimmedString(64).nullable().optional(),
  phone: trimmedString(20).nullable().optional(),
});

// ── Lead creation ───────────────────────────────────────────────────────────

export const LeadCreateSchema = z.object({
  firstName: trimmedString(60).min(1),
  lastName: trimmedString(60).optional(),
  phone: phoneE164,
  email: z.union([z.string().email().max(120), z.literal("")]).optional(),
  note: trimmedString(500).optional(),
});

// ── Stripe checkout ─────────────────────────────────────────────────────────

export const CheckoutSchema = z.object({
  plan: z.enum(["starter", "growth", "agency"]),
});

// ── Agent test ──────────────────────────────────────────────────────────────

export const AgentTestSchema = z.object({
  message: trimmedString(500).min(1),
});

// ── Twilio test ─────────────────────────────────────────────────────────────

export const TwilioTestSchema = z.object({
  twilio_account_sid: z.string().regex(/^AC[a-zA-Z0-9]{32}$/),
  twilio_auth_token: trimmedString(64).min(8),
  phone: phoneE164.optional(),
});
