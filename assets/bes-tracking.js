/* BES measurement: explicit consent, one event owner, no form contents. */
(function (w, d) {
  'use strict';
  if (w.BESTracking) return;
  var KEY = 'bes_measurement_consent_v1';
  var consent = { analytics: false, advertising: false };
  var chosen = false, loaded = false, currentPath = '', lastPage = '', previousPage = '';
  var seen = {}, landing = location.href, referrer = d.referrer;
  var campaignKeys = ['utm_source','utm_medium','utm_campaign','utm_id','utm_content','utm_term','gclid','dclid','gbraid','wbraid'];
  var catalog = {
    '00w28sbSM6oo3MkdzugEg0T': ['delegate_2day','2-Day Delegate',340],
    '7sY14oe0U4gg0A82UQgEg0U': ['delegate_2day_gala','2-Day Delegate + Gala Dinner',400],
    '8x2aEY8GA000aaIfHCgEg0P': ['delegate_1day','1-Day Delegate',200],
    'aFaeVef4YcMM6Yw3YUgEg0Q': ['delegate_1day_gala','1-Day Delegate + Gala Dinner',260],
    '00wbJ24qkfYY0A87b6gEg0R': ['online','Online',99],
    'cNidRa1e8bIIciQdzugEg0S': ['student','Student',100],
    '6oU5kE2ic5kk96EbrmgEg0V': ['industry_gala','Industry Delegate + Gala Dinner',600],
    '7sY14oaOI6oo3MkeDygEg0W': ['wetlab','Intensive CO2 Laser Blepharoplasty Wet Lab',2600]
  };
  function read(store, key) { try { return JSON.parse(store.getItem(key)); } catch (_) { return null; } }
  function save(store, key, value) { try { store.setItem(key, JSON.stringify(value)); } catch (_) {} }
  var stored = read(w.localStorage, KEY);
  if (stored && stored.version === 1 && Date.now() - stored.at < 180 * 86400000) {
    consent = { analytics: stored.analytics === true, advertising: stored.advertising === true };
    chosen = true;
  }
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  function status() { return { analytics_storage: consent.analytics ? 'granted' : 'denied', ad_storage: consent.advertising ? 'granted' : 'denied', ad_user_data: consent.advertising ? 'granted' : 'denied', ad_personalization: consent.advertising ? 'granted' : 'denied' }; }
  w.gtag('consent', 'default', status());
  // Drop arbitrary query parameters, fragments, registration tokens and email-like UTMs.
  function safeURL(raw, campaigns) {
    try {
      var u = new URL(raw, location.origin), q = new URLSearchParams();
      if (campaigns) campaignKeys.forEach(function(k) { var v = u.searchParams.get(k); if (v && v.length <= 200 && !/[@\r\n]/.test(v)) q.set(k,v); });
      return u.origin + u.pathname + (q.size ? '?' + q.toString() : '');
    } catch (_) { return ''; }
  }
  function language() { return (d.querySelector('.lang-btn.active') || {}).dataset?.lang || d.documentElement.lang || 'en'; }
  function load() {
    if (loaded || !consent.analytics) return;
    loaded = true;
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var script = d.createElement('script'); script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-K9JFTP54';
    d.head.appendChild(script);
  }
  function event(name, params) {
    if (!consent.analytics) return;
    load();
    var base = { page_location: safeURL(location.href, true), page_referrer: safeURL(previousPage || referrer, false), page_title: d.title, language: language() };
    w.dataLayer.push({ event: 'bes_event', bes_payload: { name: name, params: Object.assign(base, params || {}), advertising: consent.advertising } });
  }
  function rememberCampaign() {
    if (!consent.analytics) return;
    var url = new URL(landing), found = {};
    campaignKeys.forEach(function(k) { var v = url.searchParams.get(k); if (v && v.length <= 200 && !/[@\r\n]/.test(v)) found[k] = v; });
    if (Object.keys(found).length) save(w.sessionStorage, 'bes_campaign_v1', { at: Date.now(), params: found });
  }
  function route(path) {
    var normalized = (path || location.pathname).replace(/\/$/, '') || '/';
    if (currentPath !== normalized) seen = {};
    currentPath = normalized;
    if (!consent.analytics || lastPage === normalized) return;
    var pageURL = new URL(location.href);
    if (!lastPage) {
      var initial = new URL(landing);
      campaignKeys.forEach(function(k) { if (!pageURL.searchParams.has(k) && initial.searchParams.has(k)) pageURL.searchParams.set(k, initial.searchParams.get(k)); });
    }
    event('page_view', { page_location: safeURL(pageURL.href, true) });
    previousPage = location.origin + normalized;
    lastPage = normalized;
    if (normalized === '/program') event('view_program', { placement: 'program_page' });
    if (normalized === '/tickets') event('view_pricing', { placement: 'tickets_page' });
    if (normalized === '/co2-laser-blepharoplasty-training') event('view_specialty_landing', { specialty: 'co2_laser_blepharoplasty', landing_page: normalized });
  }
  function setConsent(analytics, advertising) {
    var was = consent.analytics;
    consent = { analytics: !!analytics, advertising: !!analytics && !!advertising };
    chosen = true;
    save(w.localStorage, KEY, Object.assign({ version: 1, at: Date.now() }, consent));
    w.gtag('consent', 'update', status());
    if (w.fbq) w.fbq('consent', consent.advertising ? 'grant' : 'revoke');
    d.getElementById('bes-consent-panel').hidden = true;
    if (!consent.analytics) {
      try { w.sessionStorage.removeItem('bes_campaign_v1'); } catch (_) {}
      // Reload stops loaded analytics/replay libraries after withdrawal.
      if (was) location.reload();
      return;
    }
    rememberCampaign(); load();
    if (!was) { lastPage = ''; route(currentPath); }
  }
  function placement(el) { return el.closest('nav,.mobile-menu') ? 'navigation' : el.closest('footer') ? 'footer' : (el.closest('.page') || {}).id || 'landing_page'; }
  function ticketClick(a) {
    var u = new URL(a.href), entry = catalog[u.pathname.slice(1)];
    if (!entry) return;
    var item = { item_id: entry[0], item_name: entry[1], price: entry[2], quantity: 1 };
    // Clicks describe the displayed offer, never the eventual paid amount.
    event('click_ticket', { item_name: item.item_name, price: item.price, currency: 'EUR', items: [item], placement: placement(a) });
    event('begin_checkout', { currency: 'EUR', value: item.price, items: [item], checkout_provider: 'stripe', checkout_stage: 'payment_link_handoff' });
    if (consent.analytics) {
      var context = read(w.sessionStorage, 'bes_campaign_v1');
      if (context && Date.now() - context.at < 30 * 60000) Object.keys(context.params).filter(function(k) { return k.indexOf('utm_') === 0 && k !== 'utm_id'; }).forEach(function(k) { u.searchParams.set(k,context.params[k]); });
      a.href = u.href;
    }
  }
  d.addEventListener('click', function(e) {
    var el = e.target.closest('a,button'); if (!el) return;
    if (el.matches('a[href^="https://buy.stripe.com/"]')) { ticketClick(el); return; }
    var key = el.getAttribute('data-i18n') || '', handler = el.getAttribute('onclick') || '', name;
    if (key === 'speakers.inquiry_btn') name = 'click_speaker_inquiry';
    else if (key === 'register.group_btn') name = 'click_group_booking';
    else if (key === 'sponsors.contact' || key === 'footer.org.sponsorship') name = 'sponsor_interest';
    else if (/showPage\('program'\)/.test(handler) || el.getAttribute('href') === '/program') name = 'click_program';
    else if (/showPage\('speakers'\)/.test(handler) || el.getAttribute('href') === '/speakers') name = 'click_speakers';
    else if (/showPage\('faq'\)/.test(handler) || el.getAttribute('href') === '/faq') name = 'click_faq';
    else if (/showPage\('contact'\)/.test(handler) || el.getAttribute('href') === '/contact') name = 'click_contact_us';
    else if (/showPage\('register'\)/.test(handler) || el.getAttribute('href') === '/tickets') name = 'click_register';
    else if (/maps\.app\.goo\.gl|google\.[^/]+\/maps/.test(el.href || '')) name = 'click_map';
    else if (el.classList.contains('hotel-web-btn')) name = 'click_hotel';
    if (name) event(name, { placement: placement(el) });
    else if (/^(mailto:|tel:|https:\/\/(wa.me|api.whatsapp.com)\/)/.test(el.href || '')) event('contact_click', { contact_method: el.href.startsWith('mailto:') ? 'email' : el.href.startsWith('tel:') ? 'phone' : 'whatsapp', placement: placement(el) });
  }, true);
  w.BESTracking = {
    route: route,
    language: function(before, after) { if (before !== after) event('change_language', { previous_language: before, language: after }); },
    lead: function(id, type) { if (['contact-form','consult-form','mission-form'].indexOf(id) !== -1) event('generate_lead', { form_id: id, lead_type: type }); }
  };
  function ready() {
    var style = d.createElement('style');
    style.textContent = '#bes-consent-panel{position:fixed;bottom:24px;left:24px;max-width:480px;z-index:10000;background:#fff;color:#142333;padding:24px;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 6px 30px #0003;font:15px/1.5 Arial,sans-serif}#bes-consent-panel[hidden]{display:none}#bes-consent-panel p{margin:0 0 16px}#bes-consent-panel button,#bes-privacy-settings{font:14px Arial,sans-serif;padding:12px;margin:4px;border:1px solid #42566b;border-radius:5px;background:white;color:#142333;cursor:pointer}#bes-consent-panel button:focus-visible,#bes-privacy-settings:focus-visible{outline:3px solid #1565c0}#bes-privacy-settings{position:fixed;bottom:8px;left:8px;z-index:9999}@media(max-width:540px){#bes-consent-panel{left:12px;right:12px;bottom:12px}}';
    d.head.appendChild(style);
    var panel = d.createElement('section'); panel.id = 'bes-consent-panel'; panel.setAttribute('role','region'); panel.setAttribute('aria-label','Privacy choices'); panel.hidden = chosen;
    panel.innerHTML = '<p><strong>Your privacy choices</strong></p><p>Allow Google Analytics to measure visits and ticket interest? Advertising also enables the Meta Pixel. No session recording is active. You can change your choice at any time.</p><button type="button" data-consent="none">Reject optional</button><button type="button" data-consent="analytics">Analytics only</button><button type="button" data-consent="all">Accept all</button>';
    panel.addEventListener('click', function(e) { var choice = e.target.dataset.consent; if (choice) setConsent(choice !== 'none', choice === 'all'); });
    var settings = d.createElement('button'); settings.type = 'button'; settings.id = 'bes-privacy-settings'; settings.textContent = 'Privacy settings'; settings.addEventListener('click',function() { panel.hidden = false; panel.querySelector('button').focus(); });
    d.body.appendChild(settings); d.body.appendChild(panel);
    rememberCampaign(); route(location.pathname);
    if (w.IntersectionObserver) {
      var observer = new IntersectionObserver(function(entries) { entries.forEach(function(entry) {
        var key = entry.target.dataset.besView;
        if (consent.analytics && entry.isIntersecting && !seen[key]) { seen[key] = true; event(key, { placement: 'home_section' }); }
      }); }, { threshold: 0.15 });
      d.querySelectorAll('[data-bes-view]').forEach(function(el) { observer.observe(el); });
    }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ready); else ready();
})(window, document);
