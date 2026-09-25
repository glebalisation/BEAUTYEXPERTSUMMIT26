# Beauty Expert Summit registration form

Portable implementation for an unlisted registration page at:

`https://beautyexpertsummit.com/registration-details?t=<secure-token>`

The page is omitted from site navigation and includes `noindex, nofollow`, but security comes from the one-time token—not from hiding the URL.

## Included

- `public/registration-details/index.html` — accessible three-step form shell
- `public/registration-details/styles.css` — BES visual design
- `public/registration-details/app.js` — EN/ES/UA form logic and Supabase Function calls
- `supabase/migrations/001_registration.sql` — relational database and private upload bucket
- `supabase/functions/stripe-webhook/index.ts` — verifies Stripe and records each paid checkout once
- `supabase/functions/registration-start/index.ts` — confirms the paid session and opens its private registration form
- `supabase/functions/registration-get/index.ts` — validates a form link and returns safe prefilling data
- `supabase/functions/registration-submit/index.ts` — validates and stores the completed form
- `CLAUDE_CODE_INSTRUCTIONS.md` — handoff prompt and implementation checklist

## Required configuration

The website must expose only:

```js
window.BES_REGISTRATION_CONFIG = {
  functionsBaseUrl: "https://YOUR_PROJECT.supabase.co/functions/v1"
};
```

Supabase Function secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ALLOWED_ORIGIN=https://beautyexpertsummit.com
REGISTRATION_URL=https://beautyexpertsummit.com/registration-details
STRIPE_SECRET_KEY=<restricted Stripe secret key>
STRIPE_WEBHOOK_SECRET=<Stripe endpoint signing secret>
STRIPE_PRICE_MAP_JSON=<JSON keyed by Stripe Price ID>
REGISTRATION_TOKEN_SECRET=<long-random-secret>
GA4_API_SECRET=<GA4 Measurement Protocol secret>
META_CAPI_ACCESS_TOKEN=<Meta dataset access token>
META_GRAPH_API_VERSION=<currently supported Graph API version, for example vXX.X>
```

Never place these secrets in browser code.

## Stripe without n8n

1. Apply migration `002_stripe_delivery.sql` and deploy `stripe-webhook` plus `registration-start`.
2. Create a Stripe webhook endpoint for `checkout.session.completed` and `checkout.session.async_payment_succeeded` at `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`.
3. For every Payment Link, set the after-payment redirect to `https://YOUR_PROJECT.supabase.co/functions/v1/registration-start?session_id={CHECKOUT_SESSION_ID}`.
4. Set `STRIPE_PRICE_MAP_JSON` to an object whose keys are the live Stripe Price IDs and values contain `type`, `label`, and `description`.

The webhook is authoritative for purchase measurement. It sends GA4 only when the consented GA client reference exists and Meta CAPI only when that reference also records advertising consent. Meta uses the Stripe Checkout session ID as `event_id`. The redirect gives the purchaser their deterministic private form link without an email automation subscription. Stripe retries failed webhook deliveries, while `stripe_events`, Checkout-session uniqueness and platform transaction/event IDs prevent duplicate processing.
