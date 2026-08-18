# Beauty Expert Summit registration form

Portable implementation for an unlisted registration page at:

`https://beautyexpertsummit.com/registration-details?t=<secure-token>`

The page is omitted from site navigation and includes `noindex, nofollow`, but security comes from the one-time token—not from hiding the URL.

## Included

- `public/registration-details/index.html` — accessible three-step form shell
- `public/registration-details/styles.css` — BES visual design
- `public/registration-details/app.js` — EN/ES/UA form logic and Supabase Function calls
- `supabase/migrations/001_registration.sql` — relational database and private upload bucket
- `supabase/functions/registration-create/index.ts` — called by n8n after Stripe payment
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
N8N_SHARED_SECRET=<long-random-secret>
```

Never place the service-role key or the n8n secret in browser code.

