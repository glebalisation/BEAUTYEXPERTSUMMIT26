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
2. Replace n8n with the included signed `stripe-webhook` Supabase Edge Function and `registration-start` redirect. Apply migration 002, map the live Price IDs, set secrets, deploy both functions and configure the Stripe endpoint/Payment Link redirects. Test in Stripe test mode before enabling live mode.
3. Create a GA4 Measurement Protocol secret and configure it only in Supabase. For analytics-consented visitors, the site passes GA's pseudonymous client ID through Stripe's `client_reference_id`; purchases without that consent marker are not sent to GA. Purchase uses the Checkout session ID as `transaction_id`; the private ledger plus GA transaction deduplication handles retries. Add a consented session ID later if same-session reporting is required.
4. Meta access verified: dataset `BESWeb` / `1843576903471823` has Meta Pixel and Conversions API traffic. Historical Purchase is unreliable (99 Purchase vs 72 InitiateCheckout in the inspected period; Meta still reports that deduplication is being parsed). The new flow emits no browser Purchase. The signed Stripe webhook sends a consented server `Purchase` with the Checkout session ID as `event_id`; configure a fresh dataset token and supported Graph API version only after test-mode validation. Never sum platform-attributed sales as unique sales.
5. Google Ads is intentionally unlinked because BES does not run Google Ads.
6. Create PostHog project (none exists yet); install through GTM only after consent and masking configuration, with private registration/payment pages excluded. No replay is enabled by this change.
7. Expand the private marketing dashboard after validated purchase/cost events arrive; get named marketing emails for Viewer sharing.

## Validation

Run `node --test tests/tracking.test.cjs` and `node --check assets/bes-tracking.js`.

Browser preview verifies consent control rendering and ordinary website navigation. Automated tests cover consent gating, single page views, campaign URL sanitation, ticket handoff fields, specialty view, language changes, successful-form hooks and no tracking on private registration pages. Production ingestion, Stripe completion and Meta dedup require integration access and are not represented as passing.

Sources: https://developers.google.com/tag-platform/gtagjs/reference and https://docs.stripe.com/payment-links/url-parameters
