import { Resend } from "resend";
import { getAppUrl } from "@/lib/env";

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
  process.env.RESEND_FROM_EMAIL ?? "Forgee <onboarding@resend.dev>";

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
  <a href="${getAppUrl()}/dashboard/leads"
     style="display:inline-block;padding:10px 20px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">
    View leads →
  </a>
</div>`,
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  firstName: string;
  agentName: string;
  trialEndDate: string;
  dashboardUrl?: string;
  twilioNumber?: string | null;
}) {
  const resend = getResend();
  const firstName = escapeHtml(opts.firstName);
  const agentName = escapeHtml(opts.agentName);
  const trialEndDate = escapeHtml(opts.trialEndDate);
  const dashboardUrl = opts.dashboardUrl ?? `${getAppUrl()}/dashboard`;
  const twilioLine = opts.twilioNumber
    ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;width:120px">Agent number</td><td style="padding:8px 0;font-size:13px;font-weight:600">${escapeHtml(opts.twilioNumber)}</td></tr>`
    : "";

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: safeSubject("Welcome to Forgee — Your 60 days start now"),
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0a0a0a">
  <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Welcome to Forgee, ${firstName} 👋</h1>
  <p style="color:#555;margin:0 0 24px;font-size:15px">
    Your AI agent <strong>${agentName}</strong> is live. Here's what you need to know:
  </p>

  <div style="background:#f9fafb;border-radius:12px;padding:20px 24px;margin:0 0 24px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:6px 0;font-size:14px">✓</td>
        <td style="padding:6px 0;font-size:14px">You have <strong>60 days completely free</strong>, until <strong>${trialEndDate}</strong></td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px">✓</td>
        <td style="padding:6px 0;font-size:14px">Your card won't be charged until day 61</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px">✓</td>
        <td style="padding:6px 0;font-size:14px">We'll send you 3 reminders before any billing happens</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px">✓</td>
        <td style="padding:6px 0;font-size:14px">You can cancel anytime in 2 clicks from your dashboard</td>
      </tr>
    </table>
  </div>

  <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
    <tr><td style="padding:8px 0;color:#888;font-size:13px;width:120px">Dashboard</td><td style="padding:8px 0;font-size:13px"><a href="${dashboardUrl}" style="color:#0a0a0a;font-weight:600">${dashboardUrl}</a></td></tr>
    ${twilioLine}
  </table>

  <a href="${dashboardUrl}"
     style="display:inline-block;padding:12px 24px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
    Go to your dashboard →
  </a>

  <p style="margin:32px 0 0;font-size:14px;color:#555">
    Questions? Just reply to this email — I read every one personally.
  </p>
  <p style="margin:8px 0 0;font-size:14px;color:#555">
    — Thomas<br>
    <span style="color:#888">Founder of Forgee</span>
  </p>
</div>`,
  });
}

export async function sendTrialReminderEmail(opts: {
  to: string;
  firstName: string;
  agentName: string;
  daysRemaining: number;
  trialEndDate: string;
  planName: string;
  planPrice: number;
}) {
  const resend = getResend();
  const firstName = escapeHtml(opts.firstName);
  const agentName = escapeHtml(opts.agentName);
  const trialEndDate = escapeHtml(opts.trialEndDate);
  const planName = escapeHtml(opts.planName);
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const cancelUrl = `${getAppUrl()}/dashboard/billing`;

  const urgency =
    opts.daysRemaining === 1
      ? "Trial ends tomorrow"
      : opts.daysRemaining === 3
      ? "3 days left in your trial"
      : "1 week left in your trial";

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: safeSubject(`Forgee: ${urgency} — your agent ${agentName} stays free until ${trialEndDate}`),
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0a0a0a">
  <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">${urgency}, ${firstName}</h1>
  <p style="color:#555;margin:0 0 24px;font-size:15px">
    Your Forgee trial ends on <strong>${trialEndDate}</strong> — that's <strong>${opts.daysRemaining} day${opts.daysRemaining === 1 ? "" : "s"}</strong> from now.
  </p>

  <div style="background:#fff8ed;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin:0 0 24px">
    <p style="margin:0;font-size:14px;color:#92400e">
      <strong>What happens on ${trialEndDate}:</strong><br>
      If you don't cancel, your <strong>${planName}</strong> plan will start billing at <strong>$${opts.planPrice}/month</strong>.
    </p>
  </div>

  <p style="font-size:14px;color:#555;margin:0 0 20px">
    Your agent ${agentName} is still completely free until then. No action needed if you want to keep it.
  </p>

  <div style="display:flex;gap:12px;margin:0 0 32px">
    <a href="${dashboardUrl}"
       style="display:inline-block;padding:11px 22px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
      Keep my agent →
    </a>
    <a href="${cancelUrl}"
       style="display:inline-block;padding:11px 22px;border:1px solid #e5e7eb;color:#6b7280;text-decoration:none;border-radius:8px;font-size:14px">
      Cancel in 2 clicks
    </a>
  </div>

  <p style="margin:0;font-size:13px;color:#888">
    — Thomas, Founder of Forgee<br>
    Reply to this email with any questions.
  </p>
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
  <a href="${getAppUrl()}/dashboard/leads"
     style="display:inline-block;padding:10px 20px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">
    View leads →
  </a>
</div>`,
  });
}
