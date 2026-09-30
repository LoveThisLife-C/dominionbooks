// Shared outbound email helpers (Resend)

export const HOWARD_EMAIL = 'pastorhlw@gmail.com'
export const DEFAULT_FROM =
  'Dominion Books <orders@howardwilliamsbooks.com>'

export function notifyTo() {
  return (
    process.env.ORDER_NOTIFY_EMAIL ||
    process.env.CONTACT_NOTIFY_EMAIL ||
    HOWARD_EMAIL
  )
}

export async function sendMail({ subject, text, replyTo }) {
  const to = notifyTo()
  const key = String(process.env.RESEND_API_KEY || '').trim()
  if (!key) return { skipped: true, to }

  const from = String(process.env.ORDER_NOTIFY_FROM || DEFAULT_FROM).trim()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  let detail = null
  try {
    detail = await res.json()
  } catch {
    detail = null
  }

  if (!res.ok) {
    console.error('Resend error', res.status, detail)
    return {
      ok: false,
      status: res.status,
      to,
      skipped: false,
      error: detail?.message || detail?.name || `Resend HTTP ${res.status}`,
    }
  }

  return { ok: true, status: res.status, to, skipped: false, id: detail?.id }
}
