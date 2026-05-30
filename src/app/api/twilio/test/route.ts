import twilio from "twilio";
import { createClient } from "@/lib/supabase/server";
import { TwilioTestSchema } from "@/lib/schemas/agent";
import { originGuard } from "@/lib/security";

// In-memory rate limit: max 10 requests per user per hour
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(userId) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return false;
}

export async function POST(request: Request) {
  const originBlock = originGuard(request);
  if (originBlock) return originBlock;

  // Require authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  // Rate limit
  if (isRateLimited(user.id)) {
    return Response.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = TwilioTestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json({ success: false, error: "Invalid credentials format." }, { status: 400 });
  }
  const { twilio_account_sid, twilio_auth_token, phone } = parsed.data;

  try {
    const client = twilio(twilio_account_sid, twilio_auth_token);

    // Verify credentials by fetching the account
    await client.api.accounts(twilio_account_sid).fetch();

    // If a phone number was provided, verify it belongs to this account
    if (phone) {
      const numbers = await client.incomingPhoneNumbers.list({
        phoneNumber: phone,
        limit: 1,
      });
      if (numbers.length === 0) {
        return Response.json({
          success: false,
          error: "Phone number not found in this Twilio account.",
        });
      }
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, error: "Could not connect to Twilio. Check your credentials." });
  }
}
