import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Forge <onboarding@resend.dev>";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://yourapp.vercel.app";

export async function sendNewLeadEmail(opts: {
  to: string;
  businessName: string;
  contactName: string | null;
  contactPhone: string | null;
  source?: string;
}) {
  const resend = getResend();
  const who = opts.contactName ?? opts.contactPhone ?? "Unknown";
  const src = opts.source === "facebook" ? "Facebook Ads" : "SMS";

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `New lead: ${who} — ${opts.businessName}`,
    html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="font-size:18px;color:#0a0a0a;margin:0 0 8px">New lead received</h2>
  <p style="color:#555;margin:0 0 20px">A new lead has been captured for <strong>${opts.businessName}</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
    <tr><td style="padding:8px 0;color:#888;font-size:13px;width:80px">Contact</td><td style="padding:8px 0;font-size:13px;font-weight:600">${who}</td></tr>
    ${opts.contactPhone ? `<tr><td style="padding:8px 0;color:#888;font-size:13px">Phone</td><td style="padding:8px 0;font-size:13px">${opts.contactPhone}</td></tr>` : ""}
    <tr><td style="padding:8px 0;color:#888;font-size:13px">Source</td><td style="padding:8px 0;font-size:13px">${src}</td></tr>
  </table>
  <a href="${APP_URL}/dashboard/leads"
     style="display:inline-block;padding:10px 20px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">
    View leads →
  </a>
</div>`,
  });
}

export async function sendDealClosedEmail(opts: {
  to: string;
  businessName: string;
  contactName: string | null;
  contactPhone: string | null;
}) {
  const resend = getResend();
  const who = opts.contactName ?? opts.contactPhone ?? "Unknown";

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Deal closed: ${who} — ${opts.businessName}`,
    html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="font-size:18px;color:#0a0a0a;margin:0 0 8px">Deal closed 🎉</h2>
  <p style="color:#555;margin:0 0 20px"><strong>${who}</strong> has been marked as closed in <strong>${opts.businessName}</strong>.</p>
  <a href="${APP_URL}/dashboard/leads"
     style="display:inline-block;padding:10px 20px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">
    View leads →
  </a>
</div>`,
  });
}
