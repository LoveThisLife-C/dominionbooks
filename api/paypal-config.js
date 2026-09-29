import { json, requirePaypalEnv } from './_lib/paypal.js'
import {
  PRICE_SINGLE,
  PRICE_BULK,
  SHIPPING,
  BULK_THRESHOLD,
  BOOK_TITLE,
} from './_lib/paypal.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  try {
    const { clientId } = requirePaypalEnv()
    const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase()
    return json(res, 200, {
      configured: true,
      clientId,
      mode: mode === 'live' ? 'live' : 'sandbox',
      currency: 'USD',
      bookTitle: BOOK_TITLE,
      pricing: {
        single: PRICE_SINGLE,
        bulk: PRICE_BULK,
        shipping: SHIPPING,
        bulkThreshold: BULK_THRESHOLD,
      },
    })
  } catch (err) {
    return json(res, 200, {
      configured: false,
      clientId: null,
      mode: 'sandbox',
      error: err.message,
      pricing: {
        single: PRICE_SINGLE,
        bulk: PRICE_BULK,
        shipping: SHIPPING,
        bulkThreshold: BULK_THRESHOLD,
      },
    })
  }
}
