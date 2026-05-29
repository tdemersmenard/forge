import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeSubject(s: string): string {
  return s.replace(/[\r\n]/g, " ").slice(0, 120);
}

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Forge <onboarding@resend.dev>";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-zeta-silk.vercel.app";

export async function sendNewLeadEmail(opts: {
  to: string;
  businessName: string;
  contactName: string | null;
  contactPhone: string | null;
  source?: string;
}) {
  const resend = getResend();
  const who = escapeHtml(opts.contactName ?? opts.contactPhone ?? "Unknown");
  const businessName = escapeHtml(opts.businessName);
  const contactPhone = escapeHtml(opts.contactPhone);
  const src = opts.source === "facebook" ? "Facebook Ads" : "SMS";

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: safeSubject(`New lead: ${who} — ${businessName}`),
    html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="font-size:18px;color:#0a0a0a;margin:0 0 8px">New lead received</h2>
  <p style="color:#555;margin:0 0 20px">A new lead has been captured for <strong>${businessName}</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
    <tr><td style="padding:8px 0;color:#888;font-size:13px;width:80px">Contact</td><td style="padding:8px 0;font-size:13px;font-weight:600">${who}</td></tr>
    ${contactPhone ? `<tr><td style="padding:8px 0;color:#888;font-size:13px">Phone</td><td style="padding:8px 0;font-size:13px">${contactPhone}</td></tr>` : ""}
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
  const who = escapeHtml(opts.contactName ?? opts.contactPhone ?? "Unknown");
  const businessName = escapeHtml(opts.businessName);

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: safeSubject(`Deal closed: ${who} — ${businessName}`),
    html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="font-size:18px;color:#0a0a0a;margin:0 0 8px">Deal closed 🎉</h2>
  <p style="color:#555;margin:0 0 20px"><strong>${who}</strong> has been marked as closed in <strong>${businessName}</strong>.</p>
  <a href="${APP_URL}/dashboard/leads"
     style="display:inline-block;padding:10px 20px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">
    View leads →
  </a>
</div>`,
  });
}
