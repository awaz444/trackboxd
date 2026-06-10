import { supabaseAdmin } from './supabase/admin';

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const APP_URL = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim().replace(/\/$/, '');

interface MailjetMessage {
  toEmail: string;
  toName: string;
  subject: string;
  htmlBody: string;
}

async function mailjetSend(msg: MailjetMessage): Promise<void> {
  const key = process.env.MAILJET_API_KEY;
  const secret = process.env.MAILJET_SECRET_KEY;
  if (!key || !secret) throw new Error('Mailjet credentials not configured');

  const creds = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${creds}` },
    body: JSON.stringify({
      Messages: [{
        From: {
          Email: process.env.MAILJET_FROM_EMAIL || 'noreply@trackboxd.com',
          Name: 'Trackboxd',
        },
        To: [{ Email: msg.toEmail, Name: msg.toName }],
        Subject: msg.subject,
        HTMLPart: msg.htmlBody,
      }],
    }),
  });
  if (!res.ok) throw new Error(`Mailjet error ${res.status}: ${await res.text()}`);
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0f0f0f;font-family:Arial,sans-serif;margin:0;padding:24px;">
<div style="max-width:480px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:36px;border:1px solid #2a2a2a;">
  <div style="text-align:center;margin-bottom:28px;">
    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">trackboxd</span>
  </div>
  ${content}
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #2a2a2a;">
    <p style="color:#555;font-size:12px;text-align:center;margin:0;">
      You're receiving this because someone interacted with your content on Trackboxd.
    </p>
  </div>
</div>
</body>
</html>`;
}

function buildFollowEmail(actorName: string, recipientName: string): string {
  return emailWrapper(`
    <p style="color:#aaa;font-size:15px;margin:0 0 16px;">Hey ${recipientName},</p>
    <p style="color:#fff;font-size:18px;font-weight:600;margin:0 0 12px;">
      <span style="color:#22c55e;">${actorName}</span> started following you
    </p>
    <p style="color:#888;font-size:14px;margin:0 0 28px;">
      Check out their profile and see what music they've been listening to.
    </p>
    <a href="${APP_URL}/notifications"
       style="display:block;text-align:center;background:#22c55e;color:#000;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;">
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
    ? ` on <strong style="color:#fff;">${trackName}</strong>`
    : '';
  return emailWrapper(`
    <p style="color:#aaa;font-size:15px;margin:0 0 16px;">Hey ${recipientName},</p>
    <p style="color:#fff;font-size:18px;font-weight:600;margin:0 0 12px;">
      <span style="color:#22c55e;">${actorName}</span> liked your ${targetType}${context}
    </p>
    <a href="${APP_URL}/notifications"
       style="display:block;text-align:center;background:#22c55e;color:#000;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;">
      View on Trackboxd
    </a>
  `);
}

type NotificationEmailParams =
  | { type: 'like'; recipientUserId: string; actorUserId: string; targetId: string; targetType: 'review' | 'annotation' }
  | { type: 'follow'; recipientUserId: string; actorUserId: string };

export async function sendNotificationEmail(params: NotificationEmailParams): Promise<void> {
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
    const recipientName = recipient.username || recipient.name;

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

    await mailjetSend({ toEmail: recipient.email, toName: recipientName, subject, htmlBody });

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
      console.warn(`[email] sendNotificationEmail skipped: Mailjet API is unreachable (${causeCode}).`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[email] [DEV MODE FALLBACK] Would send email:
To: ${recipientName} (${recipient.email})
Subject: ${subject}
Body preview: ${subject}`);
      }
    } else {
      console.error('[email] sendNotificationEmail failed:', err);
    }
  }
}