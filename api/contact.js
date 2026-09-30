import { json, readBody } from './_lib/paypal.js'
import { HOWARD_EMAIL, sendMail } from './_lib/mail.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  try {
    const body = await readBody(req)
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim()
    const message = String(body.message || '').trim()

    if (!name || !email || !message) {
      return json(res, 400, { error: 'Name, email, and message are required.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(res, 400, { error: 'Invalid email' })
    }
    if (message.length > 5000) {
      return json(res, 400, { error: 'Message is too long.' })
    }

    const text = [
      `New message from the Dominion Books contact form`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      ``,
      message,
    ].join('\n')

    const result = await sendMail({
      subject: `Contact: ${name}`,
      text,
      replyTo: email,
    })

    if (result.skipped) {
      return json(res, 200, {
        ok: true,
        delivered: false,
        mailto: HOWARD_EMAIL,
        message: 'Email service not configured; use mailto fallback.',
      })
    }

    if (!result.ok) {
      return json(res, 502, {
        error: result.error || 'Could not send message right now.',
        mailto: HOWARD_EMAIL,
      })
    }

    return json(res, 200, { ok: true, delivered: true })
  } catch (err) {
    console.error(err)
    return json(res, err.status || 500, {
      error: err.message || 'Server error',
      mailto: HOWARD_EMAIL,
    })
  }
}
