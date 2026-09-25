# BES website measurement rollout

Status: implementation branch; website NOT deployed or end-to-end validated. GTM version 2 is published.

- GTM: `GTM-K9JFTP54`, account 6378751721, container 265139894. Live version 2: `BES consented funnel tracking v1`, published 25 September 2026.
- GA4: `G-9K6V46V6L0`, property 553730115.
- Meta Pixel: `1843576903471823`.
- Dashboard: https://datastudio.google.com/reporting/0b5b0f74-e3ef-492b-8b2f-eabd4b5930fb

## Current change

The two public entry points load `assets/bes-tracking.js`. Optional tracking waits for an explicit stored choice. Analytics-only and analytics+advertising are separate choices. GTM loads once, then receives `bes_event` messages with an isolated `bes_payload` object. The supplied GTM router initializes Google once with automatic page views disabled, then forwards the explicit events. Meta receives PageView, Lead, and InitiateCheckout only with advertising consent. No browser purchase is emitted.

The container now has one Data Layer Variable (`bes_payload`, version 2), Custom Event trigger (`bes_event`) and Custom HTML tag matching `gtm-event-router.html`. Version 2 is live, but cannot collect anything until the website branch is deployed and a visitor grants consent. Review GTM preview against the production hostname before merging. The HTML file is configuration, not a publicly executable endpoint. Do not leave the old direct GA/Meta snippets alongside it.

The registration-details page contains secure tokens and personal data. All analytics/pixel code was removed from that page; it must stay outside GTM and replay coverage.

## Events

- `page_view`: initial permitted view, virtual navigation and browser back/forward; repeated same-route calls are ignored.
- `view_specialty_landing`: the actual laser-training landing page, with `co2_laser_blepharoplasty` content label (not a visitor's inferred profession).
- `view_program` / `view_pricing`: relevant route or visible home section.
- `click_ticket`: item_name, numeric price, EUR currency, items. Catalog reflects the currently displayed offers, not a verified purchase.
- `begin_checkout`: Stripe Payment Link handoff with items/value/currency; this is not confirmed checkout-page load.
- `generate_lead`: Formspree success response only for contact, consultation, mission.
- Separate contact, speaker inquiry, group booking, program, speakers, language, FAQ, map, hotel and sponsorship intent clicks. Communication links use `contact_click` without their email/phone destinations.

Eight Stripe links are explicitly mapped. When offers change, update both visible prices and the tracking catalog. Checkout currency/value must ultimately be reconciled against Stripe, including quantity/discount/tax.

Only allowlisted campaign query parameters enter GA page URLs; arbitrary parameters, fragments, tokens and email-like campaign values are excluded. Consented UTMs persist in session storage for 30 minutes and pass to Stripe Payment Links. This alone does NOT join purchases to a GA client/session.

## Remaining rollout dependencies

1. Review the published GTM configuration in preview; deploy this website branch; check Tag Assistant/GA4 DebugView on real routed URLs and back/forward. Keep enhanced-measurement browser-history page views disabled (already saved in GA4). Review automatic form/outbound-click measurement for unwanted redundant events and destination data.
2. Use the existing n8n Stripe workflow, whose link/access is still needed. Only paid Checkout sessions (including delayed payment success) may emit purchase; use actual line items and paid currency/value. Existing registration-create code is not itself a verified Stripe webhook.
3. Implement an opaque checkout reference plus consented GA client_id/session_id server-side join, then an idempotent purchase delivery ledger. Deduplicate on Stripe Checkout session ID/transaction_id, not webhook delivery ID. Handle retries and reconciliation. No GA Measurement Protocol secret belongs in website code. Do not use registration completion or thank-you page visits as purchases.
4. Verify whether any n8n/Meta CAPI purchase integration already exists. Coordinate browser/server event_id and event_name if both send conversions. Never sum platform-attributed sales as unique sales.
5. Link the intended Google Ads account; purchase primary, ticket/checkout events secondary. Connect campaign costs before reporting CPA/ROAS.
6. Create PostHog project (none exists yet); install through GTM only after consent and masking configuration, with private registration/payment pages excluded. No replay is enabled by this change.
7. Expand the private marketing dashboard after validated purchase/cost events arrive; get named marketing emails for Viewer sharing.

## Validation

Run `node --test tests/tracking.test.cjs` and `node --check assets/bes-tracking.js`.

Browser preview verifies consent control rendering and ordinary website navigation. Automated tests cover consent gating, single page views, campaign URL sanitation, ticket handoff fields, specialty view, language changes, successful-form hooks and no tracking on private registration pages. Production ingestion, Stripe completion and Meta dedup require integration access and are not represented as passing.

Sources: https://developers.google.com/tag-platform/gtagjs/reference and https://docs.stripe.com/payment-links/url-parameters
