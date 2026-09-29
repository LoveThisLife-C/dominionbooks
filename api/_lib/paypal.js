// Shared PayPal + pricing helpers for Vercel serverless routes

export const PRICE_SINGLE = 19.99
export const PRICE_BULK = 12.0
export const SHIPPING = 4.39
export const BULK_THRESHOLD = 2
export const BOOK_TITLE = "Adam's Lost Dominion"
export const CURRENCY = 'USD'

export function unitPrice(qty) {
  return qty >= BULK_THRESHOLD ? PRICE_BULK : PRICE_SINGLE
}

export function orderTotals(qty) {
  const quantity = Math.max(1, Math.min(50, Number(qty) || 1))
  const unit = unitPrice(quantity)
  const books = Number((unit * quantity).toFixed(2))
  const shipping = SHIPPING
  const total = Number((books + shipping).toFixed(2))
  return { quantity, unit, books, shipping, total }
}

export function paypalBase() {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase()
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

export function requirePaypalEnv() {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    const err = new Error(
      'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET on Vercel.',
    )
    err.status = 503
    throw err
  }
  return { clientId, clientSecret }
}

let cachedToken = null
let cachedExpiry = 0

export async function getAccessToken() {
  const now = Date.now()
  if (cachedToken && now < cachedExpiry - 60_000) return cachedToken

  const { clientId, clientSecret } = requirePaypalEnv()
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error_description || 'PayPal auth failed')
    err.status = 502
    throw err
  }
  cachedToken = data.access_token
  cachedExpiry = now + (data.expires_in || 300) * 1000
  return cachedToken
}

export function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (e) {
        reject(Object.assign(new Error('Invalid JSON body'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

export function siteOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return process.env.SITE_URL || `${proto}://${host}`
}

export async function notifyOrder(payload) {
  const to = process.env.ORDER_NOTIFY_EMAIL
  const key = process.env.RESEND_API_KEY
  if (!to || !key) return { skipped: true }

  const lines = [
    `New Dominion Books order`,
    ``,
    `Qty: ${payload.quantity}`,
    `Total: $${payload.total}`,
    `PayPal order: ${payload.paypalOrderId}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone || '—'}`,
    `Ship to:`,
    `${payload.address1}`,
    payload.address2 ? `${payload.address2}` : null,
    `${payload.city}, ${payload.state} ${payload.zip}`,
    `United States`,
  ]
    .filter(Boolean)
    .join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ORDER_NOTIFY_FROM || 'Dominion Books <onboarding@resend.dev>',
      to: [to],
      subject: `Order: ${payload.quantity}× Adam's Lost Dominion ($${payload.total})`,
      text: lines,
    }),
  })
  return { ok: res.ok, status: res.status }
}
