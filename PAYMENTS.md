# Payments setup

Checkout is wired end-to-end. After PayPal credentials are added on Vercel, live payments work immediately.

## 1. Ask Howard for

See the message template in the chat / `HOWARD-PAYPAL-REQUEST.md`.

## 2. Create PayPal REST app

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications)
2. Log in with the **Business** account
3. Create an app (Sandbox first)
4. Copy **Client ID** and **Secret**

## 3. Add env vars on Vercel

Project → Settings → Environment Variables:

| Name | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | from PayPal |
| `PAYPAL_CLIENT_SECRET` | from PayPal |
| `PAYPAL_MODE` | `sandbox` then `live` |
| `ORDER_NOTIFY_EMAIL` | `pastorhlw@gmail.com` (order + contact alerts) |
| `RESEND_API_KEY` | optional — for order/contact emails via Resend |
| `ORDER_NOTIFY_FROM` | optional — verified Resend from-address |
| `SITE_URL` | optional — production URL |

Redeploy after saving env vars.

## 4. Test

1. Open `/order`
2. Fill US shipping fields
3. Pay with PayPal Sandbox buyer account
4. Confirm `/order-success` and capture in PayPal sandbox

## 5. Go live

1. Create a **Live** PayPal app
2. Swap Client ID / Secret
3. Set `PAYPAL_MODE=live`
4. Redeploy

## Troubleshooting

**“Could not load PayPal SDK” / Client ID not recognized**

PayPal rejected the Client ID currently on Vercel (`…esnW2` — too short / invalid).

1. Open [PayPal Developer → Apps](https://developer.paypal.com/dashboard/applications)
2. Open the **Dominion Books** app
3. Toggle **Live** (or Sandbox — match `PAYPAL_MODE`)
4. Copy the **full** Client ID (usually ~80 characters) and Secret
5. Vercel → Settings → Environment Variables → update `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
6. Set `PAYPAL_MODE` to `live` or `sandbox` to match those credentials
7. **Redeploy** the project

Do not paste truncated IDs from chat or screenshots.