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
STRIPE_PAYMENT_LINK_MAP_JSON=<JSON keyed by live Stripe Payment Link ID>
STRIPE_PRICE_MAP_JSON=<optional fallback JSON keyed by Stripe Price ID>
REGISTRATION_TOKEN_SECRET=<optional dedicated long-random-secret; otherwise existing TICKET_SIGNING_SECRET is used>
GA4_API_SECRET=<GA4 Measurement Protocol secret>
META_CAPI_ACCESS_TOKEN=<Meta dataset access token>
META_GRAPH_API_VERSION=<currently supported Graph API version, for example vXX.X>
```

Never place these secrets in browser code.

## Stripe without n8n

1. Apply migrations `002_stripe_delivery.sql` and `003_registration_email.sql`, then deploy `stripe-webhook` plus `registration-start`.
2. Create a Stripe webhook endpoint for `checkout.session.completed` and `checkout.session.async_payment_succeeded` at `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`.
3. For every Payment Link, set the after-payment redirect to `https://YOUR_PROJECT.supabase.co/functions/v1/registration-start?session_id={CHECKOUT_SESSION_ID}`.
4. Set `STRIPE_PAYMENT_LINK_MAP_JSON` to an object whose keys are the eight live Stripe Payment Link IDs and values contain `type`, `label`, and `description`. `STRIPE_PRICE_MAP_JSON` remains an optional fallback for Checkout Sessions that were not opened from a Payment Link.

Current BES live-link map:

```json
{
  "plink_1U0PcAJgLCxA2cjwTQ0Zqu5T": {"type":"standard","label":"2-Day Delegate","description":"Access to all summit sessions on 28–29 November 2026"},
  "plink_1U0PcXJgLCxA2cjwIB24Kddx": {"type":"gala","label":"2-Day Delegate + Gala Dinner","description":"Two-day summit access with gala dinner"},
  "plink_1U0PaKJgLCxA2cjww47ZOlqy": {"type":"one_day","label":"1-Day Delegate","description":"Summit access on one selected day"},
  "plink_1U0PauJgLCxA2cjwfRpByGiy": {"type":"gala","label":"1-Day Delegate + Gala Dinner","description":"One selected summit day with gala dinner"},
  "plink_1U0PbQJgLCxA2cjw0V49vpUY": {"type":"online","label":"Online","description":"Live-stream access for both summit days"},
  "plink_1U0PbmJgLCxA2cjwzvtacKvv": {"type":"student","label":"Student","description":"Two-day student admission, subject to student-ID verification"},
  "plink_1U0PcrJgLCxA2cjwVpfKBxbV": {"type":"gala","label":"Industry Delegate + Gala Dinner","description":"Two-day industry admission with gala dinner"},
  "plink_1U0PsaJgLCxA2cjwEGq94GV0": {"type":"standard","label":"Intensive CO2 Laser Blepharoplasty Wet Lab","description":"ScalprumPro intensive course with two-day summit admission"}
}
```

The webhook is authoritative for purchase measurement. It sends the existing Resend-powered registration email once, sends GA4 only when the consented GA client reference exists, and sends Meta CAPI only when that reference also records advertising consent. Meta uses the Stripe Checkout session ID as `event_id`. The redirect also gives the purchaser their deterministic private form link without an automation subscription. Stripe retries failed webhook deliveries, while `stripe_events`, Checkout-session uniqueness, the email timestamp and platform transaction/event IDs prevent duplicate processing.
