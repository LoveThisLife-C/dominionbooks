import {
  BOOK_TITLE,
  CURRENCY,
  getAccessToken,
  json,
  orderTotals,
  paypalBase,
  readBody,
  requirePaypalEnv,
  siteOrigin,
} from './_lib/paypal.js'

function validateShipping(body) {
  const required = ['name', 'email', 'address1', 'city', 'state', 'zip']
  for (const key of required) {
    if (!String(body[key] || '').trim()) {
      const err = new Error(`Missing field: ${key}`)
      err.status = 400
      throw err
    }
  }
  const email = String(body.email).trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('Invalid email')
    err.status = 400
    throw err
  }
  const state = String(body.state).trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(state)) {
    const err = new Error('State must be a 2-letter US code (e.g. OR)')
    err.status = 400
    throw err
  }
  const zip = String(body.zip).trim()
  if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    const err = new Error('ZIP must be a US postal code')
    err.status = 400
    throw err
  }
  return {
    name: String(body.name).trim(),
    email,
    phone: String(body.phone || '').trim(),
    address1: String(body.address1).trim(),
    address2: String(body.address2 || '').trim(),
    city: String(body.city).trim(),
    state,
    zip,
  }
}

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
    const ship = validateShipping(body)
    const totals = orderTotals(body.qty)
    const origin = siteOrigin(req)

    const token = await getAccessToken()
    const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: `${BOOK_TITLE} paperback × ${totals.quantity}`,
            custom_id: JSON.stringify({
              qty: totals.quantity,
              email: ship.email,
            }).slice(0, 127),
            amount: {
              currency_code: CURRENCY,
              value: totals.total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: CURRENCY,
                  value: totals.books.toFixed(2),
                },
                shipping: {
                  currency_code: CURRENCY,
                  value: totals.shipping.toFixed(2),
                },
              },
            },
            items: [
              {
                name: BOOK_TITLE,
                quantity: String(totals.quantity),
                unit_amount: {
                  currency_code: CURRENCY,
                  value: totals.unit.toFixed(2),
                },
                category: 'PHYSICAL_GOODS',
              },
            ],
            shipping: {
              type: 'SHIPPING',
              name: { full_name: ship.name },
              address: {
                address_line_1: ship.address1,
                address_line_2: ship.address2 || undefined,
                admin_area_2: ship.city,
                admin_area_1: ship.state,
                postal_code: ship.zip,
                country_code: 'US',
              },
            },
          },
        ],
        application_context: {
          brand_name: 'Dominion Books',
          shipping_preference: 'SET_PROVIDED_ADDRESS',
          user_action: 'PAY_NOW',
          return_url: `${origin}/order-success`,
          cancel_url: `${origin}/order-cancel`,
        },
      }),
    })

    const order = await orderRes.json()
    if (!orderRes.ok) {
      console.error('PayPal create order error', order)
      return json(res, 502, {
        error: order.message || 'Could not create PayPal order',
        details: order.details || null,
      })
    }

    // Stash shipping on the client via response; capture route re-reads PayPal shipping
    return json(res, 200, {
      id: order.id,
      status: order.status,
      totals,
      shipping: ship,
    })
  } catch (err) {
    console.error(err)
    return json(res, err.status || 500, { error: err.message || 'Server error' })
  }
}
