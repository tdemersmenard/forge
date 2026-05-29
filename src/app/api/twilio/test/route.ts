import twilio from "twilio";

export async function POST(request: Request) {
  let body: { twilio_account_sid?: string; twilio_auth_token?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const { twilio_account_sid, twilio_auth_token, phone } = body;

  if (!twilio_account_sid || !twilio_auth_token) {
    return Response.json(
      { success: false, error: "Account SID and Auth Token are required." },
      { status: 400 }
    );
  }

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
          error: `Phone number ${phone} not found in this account.`,
        });
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not connect to Twilio.";
    return Response.json({ success: false, error: message });
  }
}
