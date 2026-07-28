import { Resend } from 'resend';
import { supabaseAdmin } from './supabase/admin';

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const APP_URL = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
// Email images must always resolve to a publicly reachable host, even when
// this runs against a local dev server — localhost URLs are dead to Gmail etc.
const EMAIL_ASSET_BASE_URL = 'https://www.trackboxd.com';
const LOGO_URL = `${EMAIL_ASSET_BASE_URL}/trackboxd-logo.png`;

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Trackboxd <onboarding@resend.dev>';

async function resendSend(toEmail: string, toName: string, subject: string, htmlBody: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: `${toName} <${toEmail}>`,
    subject,
    html: htmlBody,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Plain-text body -> paragraphs, preserving blank-line breaks. Input is
// admin-authored but still escaped since it's rendered as HTML in inboxes.
function textToParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="color:#5C5537;font-size:15px;line-height:1.6;margin:0 0 16px;text-align:center;">${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Trackboxd brand palette: cream background, olive text, deep green accent.
// Gmail (and some other clients) auto-invert light-themed emails under dark
// mode unless the email explicitly opts out via color-scheme meta tags AND
// uses solid bgcolor attributes (not just CSS) on every colored container —
// CSS-only backgrounds get stripped/inverted first.
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <style>
    :root { color-scheme: light only; supported-color-schemes: light only; }
    body { background:#FFFBEb !important; }
  </style>
</head>
<body bgcolor="#FFFBEb" style="background:#FFFBEb;font-family:'Lora',Georgia,serif;margin:0;padding:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFBEb" style="background:#FFFBEb;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFF5" style="max-width:480px;background:#FFFFF5;border-radius:16px;border:1px solid #E5DFC0;">
<tr><td style="padding:36px;">
  <div style="text-align:center;margin-bottom:28px;">
    <img src="${LOGO_URL}" alt="Trackboxd" height="32" style="height:32px;width:auto;display:inline-block;" />
  </div>
  ${content}
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5DFC0;">
    <p style="color:#5C5537;font-size:12px;text-align:center;margin:0;font-family:'Lora',Georgia,serif;">
      You're receiving this because someone interacted with your content on Trackboxd.
    </p>
  </div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildFollowEmail(actorName: string, recipientName: string): string {
  return emailWrapper(`
    <p style="color:#8A8264;font-size:15px;margin:0 0 16px;text-align:center;">Hey ${recipientName},</p>
    <p style="color:#5C5537;font-size:18px;font-weight:700;margin:0 0 12px;text-align:center;">
      <span style="color:#5C5537;">${actorName}</span> started following you
    </p>
    <p style="color:#8A8264;font-size:14px;margin:0 0 28px;text-align:center;">
      Check out their profile and see what music they've been listening to.
    </p>
    <a href="${APP_URL}/notifications"
       style="display:block;text-align:center;background:#5C5537;color:#FFFBEb;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;">
      View on Trackboxd
    </a>
  `);
}

function buildLikeEmail(
  actorName: string,
  recipientName: string,
  targetType: 'review' | 'annotation',
  trackName: string,
): string {
  const context = trackName
    ? ` on <strong style="color:#5C5537;">${trackName}</strong>`
    : '';
  return emailWrapper(`
    <p style="color:#8A8264;font-size:15px;margin:0 0 16px;text-align:center;">Hey ${recipientName},</p>
    <p style="color:#5C5537;font-size:18px;font-weight:700;margin:0 0 12px;text-align:center;">
      <span style="color:#5C5537;">${actorName}</span> liked your ${targetType}${context}
    </p>
    <a href="${APP_URL}/notifications"
       style="display:block;text-align:center;background:#5C5537;color:#FFFBEb;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;">
      View on Trackboxd
    </a>
  `);
}

type NotificationEmailParams =
  | { type: 'like'; recipientUserId: string; actorUserId: string; targetId: string; targetType: 'review' | 'annotation' }
  | { type: 'follow'; recipientUserId: string; actorUserId: string };

export async function sendNotificationEmail(params: NotificationEmailParams): Promise<void> {
  // Populated inside the try block; used by the dev-mode fallback in the catch block.
  let logRecipientEmail: string | undefined;
  let logRecipientName: string | undefined;
  let logSubject: string | undefined;

  try {
    // Enforce 1-hour cooldown per (recipient, notification type)
    const { data: cooldown } = await supabaseAdmin
      .from('email_cooldowns')
      .select('last_sent_at')
      .eq('user_id', params.recipientUserId)
      .eq('notification_type', params.type)
      .maybeSingle();

    if (cooldown?.last_sent_at) {
      const elapsed = Date.now() - new Date(cooldown.last_sent_at).getTime();
      if (elapsed < COOLDOWN_MS) return;
    }

    // Fetch recipient and actor in parallel
    const [{ data: recipient }, { data: actor }] = await Promise.all([
      supabaseAdmin.from('users').select('email, name, username').eq('id', params.recipientUserId).single(),
      supabaseAdmin.from('users').select('name, username').eq('id', params.actorUserId).single(),
    ]);

    if (!recipient?.email || !actor) return;

    const actorName = actor.username || actor.name;
    const recipientEmail = recipient.email;
    const recipientName = recipient.username || recipient.name;
    logRecipientEmail = recipientEmail;
    logRecipientName = recipientName;

    let subject: string;
    let htmlBody: string;

    if (params.type === 'follow') {
      subject = `${actorName} started following you on Trackboxd`;
      htmlBody = buildFollowEmail(actorName, recipientName);
    } else {
      // Fetch track name via foreign key join
      const table = params.targetType === 'review' ? 'reviews' : 'annotations';
      const { data: target } = await supabaseAdmin
        .from(table)
        .select('spotify_items(name, artist)')
        .eq('id', params.targetId)
        .single();

      const item = (target as any)?.spotify_items;
      const trackName: string = item
        ? (item.artist ? `${item.name} by ${item.artist}` : item.name)
        : '';

      subject = trackName
        ? `${actorName} liked your ${params.targetType} on ${trackName}`
        : `${actorName} liked your ${params.targetType} on Trackboxd`;
      htmlBody = buildLikeEmail(actorName, recipientName, params.targetType, trackName);
    }
    logSubject = subject;

    await resendSend(recipientEmail, recipientName, subject, htmlBody);

    // Stamp the cooldown after a successful send
    await supabaseAdmin
      .from('email_cooldowns')
      .upsert(
        { user_id: params.recipientUserId, notification_type: params.type, last_sent_at: new Date().toISOString() },
        { onConflict: 'user_id,notification_type' },
      );
  } catch (err: any) {
    // Fire-and-forget — never propagate errors to the caller
    const causeCode = err?.cause?.code || err?.code;
    if (causeCode === 'ENOTFOUND' || causeCode === 'EAI_AGAIN') {
      console.warn(`[email] sendNotificationEmail skipped: Resend API is unreachable (${causeCode}).`);
      if (process.env.NODE_ENV === 'development' && logRecipientEmail) {
        console.log(`[email] [DEV MODE FALLBACK] Would send email:
To: ${logRecipientName} (${logRecipientEmail})
Subject: ${logSubject}
Body preview: ${logSubject}`);
      }
    } else {
      console.error('[email] sendNotificationEmail failed:', err);
    }
  }
}

// Renders an admin-composed broadcast/custom email in the same branded shell.
export function buildCustomEmail(heading: string, message: string, ctaText?: string, ctaUrl?: string): string {
  const cta = ctaText && ctaUrl
    ? `<a href="${escapeHtml(ctaUrl)}"
         style="display:block;text-align:center;background:#5C5537;color:#FFFBEb;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;margin-top:12px;">
        ${escapeHtml(ctaText)}
      </a>`
    : '';
  return emailWrapper(`
    <p style="color:#5C5537;font-size:20px;font-weight:700;margin:0 0 20px;text-align:center;">
      ${escapeHtml(heading)}
    </p>
    ${textToParagraphs(message)}
    ${cta}
  `);
}

export interface CustomEmailRecipient {
  toEmail: string;
  toName: string;
  subject: string;
  html: string;
}

// Sends a batch of already-built custom emails via Resend's batch endpoint
// (max 100 per call), chunking as needed. Returns per-recipient results so
// the caller can report which addresses failed without aborting the batch.
export async function sendCustomEmailBatch(
  items: CustomEmailRecipient[],
): Promise<{ toEmail: string; success: boolean; error?: string }[]> {
  const CHUNK_SIZE = 100;
  const results: { toEmail: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const { data, error } = await resend.batch.send(
      chunk.map((item) => ({
        from: FROM_EMAIL,
        to: `${item.toName} <${item.toEmail}>`,
        subject: item.subject,
        html: item.html,
      })),
    );

    if (error) {
      chunk.forEach((item) => results.push({ toEmail: item.toEmail, success: false, error: error.message }));
      continue;
    }

    // Resend's batch response preserves input order.
    chunk.forEach((item, idx) => {
      const sent = data?.data?.[idx];
      results.push({ toEmail: item.toEmail, success: !!sent });
    });
  }

  return results;
}
