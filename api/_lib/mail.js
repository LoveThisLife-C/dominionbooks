// Shared outbound email helpers (Resend)

export const HOWARD_EMAIL = 'pastorhlw@gmail.com'

export function notifyTo() {
  return process.env.ORDER_NOTIFY_EMAIL || process.env.CONTACT_NOTIFY_EMAIL || HOWARD_EMAIL
}

export async function sendMail({ subject, text, replyTo }) {
  const to = notifyTo()
  const key = process.env.RESEND_API_KEY
  if (!key) return { skipped: true, to }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ORDER_NOTIFY_FROM || 'Dominion Books <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })
  return { ok: res.ok, status: res.status, to, skipped: false }
}
