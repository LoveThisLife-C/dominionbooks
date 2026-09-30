# Resend setup (contact form + order alerts)

Messages from `/contact` and paid-order notices go to **pastorhlw@gmail.com**.

`onboarding@resend.dev` can only email *your* Resend login address.  
To email Howard, verify **howardwilliamsbooks.com** in Resend.

## 1. Create Resend account

1. Go to https://resend.com/signup  
2. Sign up (use your freelancer email is fine)  
3. Open **API Keys** → **Create API Key** → copy `re_…`

## 2. Verify the domain

1. Resend → **Domains** → **Add Domain**  
2. Enter: `howardwilliamsbooks.com`  
   (or a subdomain like `mail.howardwilliamsbooks.com` — recommended)  
3. Resend shows DNS records (TXT / MX / CNAME)

## 3. Add those records in Namecheap

1. Namecheap → Domain List → **Manage** → **Advanced DNS**  
2. Add each record Resend shows (copy exactly)  
3. Wait until Resend shows the domain as **Verified** (often 5–30 min)

## 4. Add env vars on Vercel

Project → Settings → Environment Variables (Production + Preview):

| Name | Value |
|---|---|
| `RESEND_API_KEY` | `re_…` from step 1 |
| `ORDER_NOTIFY_EMAIL` | `pastorhlw@gmail.com` |
| `ORDER_NOTIFY_FROM` | `Dominion Books <orders@howardwilliamsbooks.com>` |

Use an address on the **verified** domain in `ORDER_NOTIFY_FROM`.  
If you verified `mail.howardwilliamsbooks.com`, use e.g.  
`Dominion Books <orders@mail.howardwilliamsbooks.com>`.

Redeploy after saving.

## 5. Test

1. Open https://howardwilliamsbooks.com/contact (or the Vercel URL)  
2. Send a short test message with your own email  
3. Howard should receive it at **pastorhlw@gmail.com**  
4. Reply-To is the visitor’s email, so he can reply directly

## Troubleshooting

- Form opens the mail app instead → `RESEND_API_KEY` missing or redeploy not done  
- 403 / domain not verified → finish DNS in Namecheap, wait, then check Resend Domains  
- Wrong From domain → `ORDER_NOTIFY_FROM` must match the verified domain  
