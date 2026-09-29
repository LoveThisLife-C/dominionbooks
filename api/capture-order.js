import {
  getAccessToken,
  json,
  notifyOrder,
  orderTotals,
  paypalBase,
  readBody,
  requirePaypalEnv,
} from './_lib/paypal.js'

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
    requirePaypalEnv()
    const body = await readBody(req)
    const orderId = String(body.orderID || body.orderId || '').trim()
    if (!orderId) {
      return json(res, 400, { error: 'Missing orderID' })
    }

    const token = await getAccessToken()
    const capRes = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    })
    const capture = await capRes.json()
    if (!capRes.ok) {
      console.error('PayPal capture error', capture)
      return json(res, 502, {
        error: capture.message || 'Payment capture failed',
        details: capture.details || null,
      })
    }

    const unit = capture.purchase_units?.[0]
    const ship = unit?.shipping
    const amount = unit?.payments?.captures?.[0]?.amount?.value
    const custom = (() => {
      try {
        return JSON.parse(unit?.custom_id || '{}')
      } catch {
        return {}
      }
    })()
    const qty = Number(custom.qty) || 1
    const totals = orderTotals(qty)

    const notifyPayload = {
      quantity: qty,
      total: amount || totals.total.toFixed(2),
      paypalOrderId: capture.id,
      name: ship?.name?.full_name || body.name || 'Customer',
      email: custom.email || body.email || '',
      phone: body.phone || '',
      address1: ship?.address?.address_line_1 || '',
      address2: ship?.address?.address_line_2 || '',
      city: ship?.address?.admin_area_2 || '',
      state: ship?.address?.admin_area_1 || '',
      zip: ship?.address?.postal_code || '',
    }

    try {
      await notifyOrder(notifyPayload)
    } catch (e) {
      console.error('Notify failed', e)
    }

    return json(res, 200, {
      id: capture.id,
      status: capture.status,
      totals,
      payer: capture.payer || null,
    })
  } catch (err) {
    console.error(err)
    return json(res, err.status || 500, { error: err.message || 'Server error' })
  }
}
