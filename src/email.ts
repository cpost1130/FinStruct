const RESEND_API = "https://api.resend.com/emails";

function getApiKey(): string | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[FinStruct] RESEND_API_KEY not set — email sending disabled");
    return null;
  }
  return key;
}

async function sendEmail(payload: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FinStruct <onboarding@resend.dev>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[FinStruct] Resend API error ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error("[FinStruct] Failed to send email:", err);
  }
}

export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  await sendEmail({
    to: [to],
    subject: "Welcome to FinStruct! 🎉",
    html: welcomeEmailHtml(name || to),
  });
  console.log(`[FinStruct] Welcome email sent to ${to}`);
}

export async function sendSignupNotification(
  userEmail: string,
  userName?: string,
): Promise<void> {
  await sendEmail({
    to: ["finstruct-2462085a@ctomail.io"],
    subject: `New FinStruct signup: ${userEmail}`,
    html: signupNotificationHtml(userEmail, userName),
  });
  console.log(`[FinStruct] Signup notification sent for ${userEmail}`);
}

// ─── Email Templates ──────────────────────────────────────────────────────

function welcomeEmailHtml(nameOrEmail: string): string {
  const displayName = nameOrEmail.includes("@")
    ? nameOrEmail.split("@")[0]
    : nameOrEmail;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <span style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; color: white; font-weight: 700; font-size: 20px; text-align: center;">F</span>
            </td>
          </tr>
        </table>
        <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">
          Welcome to FinStruct! 🎉
        </h1>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #6b7280; text-align: center;">
          Hey ${displayName}, we're excited to have you on board.
          FinStruct lets you build custom financial databases — no SQL, no spreadsheets, no headaches.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <a href="https://finstruct.vercel.app/dashboard"
                 style="display: inline-block; padding: 14px 36px; background: #6366f1; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
                Go to your dashboard →
              </a>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; padding: 24px;">
          <tr><td style="padding-bottom: 16px; font-size: 14px; color: #374151;"><strong>Getting started is easy:</strong></td></tr>
          <tr><td style="padding-bottom: 10px; font-size: 14px; color: #6b7280;">1. <strong>Pick a template</strong> — Personal Budget, Business Expenses, or Investment Portfolio</td></tr>
          <tr><td style="padding-bottom: 10px; font-size: 14px; color: #6b7280;">2. <strong>Define your fields</strong> — drag-and-drop schema builder, no code needed</td></tr>
          <tr><td style="font-size: 14px; color: #6b7280;">3. <strong>Add records</strong> — start tracking and watch your dashboard come to life</td></tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af; text-align: center;">
          Need help? Just reply to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function signupNotificationHtml(
  userEmail: string,
  userName?: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">🔔 New FinStruct signup</p>
        <p style="margin: 0 0 4px; font-size: 18px; font-weight: 600; color: #111827;">
          ${userEmail}
        </p>
        ${userName ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Name: ${userName}</p>` : ""}
        <p style="margin: 16px 0 0; font-size: 13px; color: #9ca3af;">
          ${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
