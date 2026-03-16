import crypto from 'crypto';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'no-reply@greasy.ai';
const EMAIL_VERIFY_SECRET = process.env.EMAIL_VERIFY_SECRET || '';
const APP_URL = process.env.NEXTAUTH_URL || 'https://greasy.ai';

export function generateVerifyToken(donationId: string, action: 'yes' | 'no'): string {
  const payload = `${donationId}:${action}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', EMAIL_VERIFY_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  return token;
}

export function verifyToken(token: string): { donationId: string; action: 'yes' | 'no' } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;

    const [donationId, action, timestampStr, signature] = parts;
    if (action !== 'yes' && action !== 'no') return null;

    // Check token age (72 hours max)
    const timestamp = parseInt(timestampStr, 10);
    const age = Date.now() - timestamp;
    if (age > 72 * 60 * 60 * 1000) return null;

    // Verify signature
    const payload = `${donationId}:${action}:${timestampStr}`;
    const hmac = crypto.createHmac('sha256', EMAIL_VERIFY_SECRET);
    hmac.update(payload);
    const expectedSig = hmac.digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return null;
    }

    return { donationId, action: action as 'yes' | 'no' };
  } catch {
    return null;
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY not set');
    return false;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[Email] Send failed:', err);
    return false;
  }

  return true;
}

export async function sendAdminAlert(subject: string, body: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) return false;
  const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
    <h2 style="color:#dc2626">${subject}</h2>
    <pre style="background:#f9fafb;padding:16px;border-radius:8px;font-size:13px;white-space:pre-wrap">${body}</pre>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Greasy automated alert</p>
  </div>`;
  return sendEmail(adminEmail, `[Greasy Alert] ${subject}`, html);
}

export interface ConfirmationEmailParams {
  to: string;
  donorName: string | null;
  amountCents: number;
  recipientName: string;
  timeframeLabel: string;
  commitmentDescription: string | null;
  hasAntiCharity: boolean;
  antiCharityName: string | null;
}

export async function sendConfirmationEmail(params: ConfirmationEmailParams): Promise<boolean> {
  const {
    to, donorName, amountCents, recipientName, timeframeLabel,
    commitmentDescription, hasAntiCharity, antiCharityName,
  } = params;

  const amount = (amountCents / 100).toFixed(2);
  const name = donorName || 'there';

  const motivationSection = hasAntiCharity && antiCharityName
    ? `<p style="margin:16px 0">Your donation will go to <strong>${antiCharityName}</strong> if you don't follow through — that's your motivation to succeed.</p>`
    : '';

  const commitmentSection = commitmentDescription
    ? `<div style="background:#f9fafb;border-left:4px solid #16a34a;padding:12px 16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;font-weight:600;color:#15803d">Your commitment:</p>
        <p style="margin:8px 0 0">${commitmentDescription}</p>
       </div>`
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">You're committed, ${name}!</h1>
      <p style="color:#6b7280;margin-bottom:24px">Your $${amount} pledge to <strong>${recipientName}</strong> is locked in until <strong>${timeframeLabel}</strong>.</p>
      ${commitmentSection}
      ${motivationSection}
      <p style="margin-top:24px;color:#6b7280;font-size:14px">We'll remind you as your deadline approaches. You've got this.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">Greasy — financial accountability for real commitments.</p>
    </div>
  `;

  return sendEmail(to, `Your commitment is locked in — $${amount} to ${recipientName}`, html);
}

export interface ReminderEmailParams {
  to: string;
  donorName: string | null;
  amountCents: number;
  recipientName: string;
  antiCharityName: string | null;
  commitmentDescription: string | null;
  captureAt: string;
}

export async function sendReminderEmail(params: ReminderEmailParams): Promise<boolean> {
  const { to, donorName, amountCents, recipientName, antiCharityName, commitmentDescription, captureAt } = params;

  const amount = (amountCents / 100).toFixed(2);
  const name = donorName || 'there';
  const deadline = new Date(captureAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const commitmentSection = commitmentDescription
    ? `<div style="background:#f9fafb;border-left:4px solid #16a34a;padding:12px 16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;font-weight:600;color:#15803d">Your commitment:</p>
        <p style="margin:8px 0 0">${commitmentDescription}</p>
       </div>`
    : '';

  const antiCharitySection = antiCharityName
    ? `<p style="color:#dc2626;margin:16px 0">Remember: if you don't follow through, your $${amount} goes to <strong>${antiCharityName}</strong>.</p>`
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">One week to go, ${name}</h1>
      <p style="color:#6b7280;margin-bottom:16px">Your $${amount} commitment to <strong>${recipientName}</strong> is due <strong>${deadline}</strong>. You've got one week.</p>
      ${commitmentSection}
      ${antiCharitySection}
      <p style="margin-top:24px;color:#6b7280;font-size:14px">Stay focused. You'll hear from us again as the deadline approaches.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">Greasy — financial accountability for real commitments.</p>
    </div>
  `;

  return sendEmail(to, `One week left: your $${amount} commitment to ${recipientName}`, html);
}

export interface CheckinEmailParams {
  to: string;
  donorName: string | null;
  donationId: string;
  amountCents: number;
  recipientName: string;
  antiCharityName: string | null;
  commitmentDescription: string | null;
  captureAt: string;
}

export async function sendCheckinEmail(params: CheckinEmailParams): Promise<boolean> {
  const {
    to, donorName, donationId, amountCents, recipientName,
    antiCharityName, commitmentDescription, captureAt,
  } = params;

  const amount = (amountCents / 100).toFixed(2);
  const name = donorName || 'there';
  const deadline = new Date(captureAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const yesToken = generateVerifyToken(donationId, 'yes');
  const noToken = generateVerifyToken(donationId, 'no');
  const yesUrl = `${APP_URL}/api/commitment/verify?token=${yesToken}`;
  const noUrl = `${APP_URL}/api/commitment/verify?token=${noToken}`;

  const commitmentSection = commitmentDescription
    ? `<div style="background:#f9fafb;border-left:4px solid #16a34a;padding:12px 16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;font-weight:600;color:#15803d">Your commitment:</p>
        <p style="margin:8px 0 0">${commitmentDescription}</p>
       </div>`
    : '';

  const antiCharityWarning = antiCharityName
    ? `<p style="color:#dc2626;margin:16px 0">If you don't respond, your $${amount} will go to <strong>${antiCharityName}</strong>.</p>`
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Time to check in, ${name}</h1>
      <p style="color:#6b7280;margin-bottom:16px">Your $${amount} commitment to <strong>${recipientName}</strong> is due <strong>${deadline}</strong>.</p>
      ${commitmentSection}
      <p style="margin:16px 0;font-weight:600">Did you follow through?</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:0 8px 0 0;width:50%">
            <a href="${yesUrl}" style="display:block;background:#16a34a;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
              ✅ Yes, I did it!
            </a>
          </td>
          <td style="padding:0 0 0 8px;width:50%">
            <a href="${noUrl}" style="display:block;background:#dc2626;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
              ❌ No, I didn't
            </a>
          </td>
        </tr>
      </table>
      ${antiCharityWarning}
      <p style="margin-top:24px;color:#6b7280;font-size:14px">You have 48 hours to respond before your payment is automatically processed.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">Greasy — financial accountability for real commitments.</p>
    </div>
  `;

  return sendEmail(to, `Check-in: Did you follow through? $${amount} deadline approaching`, html);
}
