# Claude Code handoff: Beauty Expert Summit registration

Work from the `bes-registration` directory. Integrate this package into the existing Beauty Expert Summit website without changing the public navigation or visual identity.

## Goal

Publish an unlisted, multilingual registration page at `/registration-details`. A successful Stripe payment creates exactly one registration and exactly one secure form link. Ticket type is fixed by the Stripe Price ID and cannot be changed in the browser.

## Before editing

1. Inspect the existing website stack, routing, deployment platform, CSP, asset conventions and environment-variable conventions.
2. Find the real header/logo asset and replace `/assets/bes26-logo.png` with its correct project path.
3. Preserve the existing site framework. Convert the portable HTML/CSS/JS into native components only if the site already uses a framework.
4. Do not add the page to navigation, sitemap, internal search or marketing links.

## Required behavior

- Route: `/registration-details?t=<one-time-token>`
- Add `noindex, nofollow, noarchive` and an `X-Robots-Tag: noindex` response header where hosting supports it.
- EN/ES/UA language switch must translate labels, validation messages, options, review content and success/error states.
- Ticket type comes only from the authenticated server response.
- Common required fields: first name, last name, email from Stripe (read-only), phone, country, specialty, institution/clinic/university.
- Badge name is required for every in-person type and absent for Online.
- One-day requires 28 or 29 November 2026.
- Gala collects attendance, diet and allergies.
- Student requires private proof upload and enters `verification_pending`.
- Online has no badge or venue QR and receives livestream instructions later.
- Speaker requires job title, presentation title, portrait and promotional consent; biography is optional.
- The paid ticket name remains the Stripe purchaser name; never overwrite it from the form.
- Continue stays gray/disabled until visible required fields are valid, then becomes bright blue with glow.
- One purchase equals one ticket and one form. Do not add quantity or additional-attendee flows.

## Supabase

1. Create/select the Supabase Free project.
2. Apply `supabase/migrations/001_registration.sql` using the Supabase migration workflow.
3. Deploy `registration-create`, `registration-get` and `registration-submit` Edge Functions.
4. Set secrets listed in `README.md`. Use the exact production origin, with a separate explicit localhost origin only in local development.
5. Keep `registration-private` private. Admin downloads must use short-lived signed URLs.
6. No public database policies should be added. Browser traffic goes through the Edge Functions.
7. Before production, make submission atomic: implement a Postgres RPC/transaction that updates the registration and inserts its conditional record together. A failed conditional insert must not leave a registration marked completed.
8. Add rate limiting, structured error logging and file-signature validation. Do not trust filename extensions or MIME headers alone.
9. Add a retention policy for student documents, speaker portraits and dietary information.

## Website configuration

Inject this before `app.js`, using the production project URL:

```html
<script>
window.BES_REGISTRATION_CONFIG = {
  functionsBaseUrl: "https://YOUR_PROJECT.supabase.co/functions/v1"
};
</script>
```

Only this public Functions URL belongs in browser code. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `N8N_SHARED_SECRET`.

## n8n and Stripe

1. In the Stripe `checkout.session.completed` workflow, verify the Stripe event and reject unpaid/duplicate sessions.
2. Map every Stripe Price ID to one internal type: `standard`, `one_day`, `gala`, `student`, `online` or `speaker`. Keep this mapping in one configuration table so future ticket types do not require workflow duplication.
3. Call `registration-create` with header `x-n8n-secret` and the payment fields expected by the function.
4. Send the returned `form_url` through Gmail.
5. Add a Supabase-triggered n8n workflow for completed registrations. Make it idempotent using registration ID plus event/status.
6. Student registrations must wait for manual approval. Online registrations must not generate badge/venue check-in records.

## Verification checklist

- Test all six ticket types in EN, ES and UA on desktop and 360px mobile.
- Test expired, malformed, reused and already-completed links.
- Confirm a browser cannot change the ticket type or email.
- Confirm Russia variants are rejected server-side.
- Confirm files over 5 MB and unapproved formats are rejected.
- Confirm student and speaker files cannot be opened without authenticated, time-limited admin access.
- Confirm double-clicking submit cannot create duplicates.
- Confirm no service-role key or n8n secret appears in built assets, source maps or browser network payloads.
- Run the site’s existing formatting, type-checking, tests and production build.
- Do not activate the Stripe/n8n workflow until the owner reviews end-to-end test records and emails.

