const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('assets/bes-tracking.js', 'utf8');
function setup(consent, url = 'https://beautyexpertsummit.com/?utm_source=meta&utm_campaign=bes26') {
  const listeners = {}, elements = {}, scripts = [];
  const storage = () => { const m = new Map(); return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}; };
  const localStorage = storage(), sessionStorage = storage();
  if (consent) localStorage.setItem('bes_measurement_consent_v1', JSON.stringify({version:1,at:Date.now(),...consent}));
  function element() {return {dataset:{},setAttribute(){},addEventListener(k,f){this[k]=f;},querySelector(){return {focus(){}};}};}
  const document = {cookie:'_ga=GA1.1.123456.987654',referrer:'https://example.com/?email=secret@example.com',title:'BES',readyState:'loading',documentElement:{lang:'en'},head:{appendChild:e=>scripts.push(e)},body:{appendChild:e=>elements[e.id]=e},createElement:element,querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>elements[id],addEventListener:(k,f)=>listeners[k]=f};
  const location = new URL(url); location.reload=()=>{};
  const window = {localStorage,sessionStorage};
  vm.runInNewContext(source, {window,document,location,URL,URLSearchParams,Date,Object});
  listeners.DOMContentLoaded();
  return {window,document,location,listeners,elements,scripts,events:()=>window.dataLayer.filter(x=>x.event==='bes_event').map(x=>x.bes_payload)};
}
test('no optional scripts or events before consent; accepting starts one page view',()=>{
 const t=setup(); assert.equal(t.scripts.filter(x=>x.src).length,0); assert.equal(t.events().length,0);
 t.elements['bes-consent-panel'].click({target:{dataset:{consent:'analytics'}}});
 assert.equal(t.scripts.filter(x=>x.src).length,1); assert.equal(t.events().filter(x=>x.name==='page_view').length,1);
 assert.equal(t.events()[0].advertising,false);
});
test('initial and repeated route calls do not duplicate views; back is a new view',()=>{
 const t=setup({analytics:true,advertising:false}); t.window.BESTracking.route('/');
 t.location.pathname='/program';t.location.search='';t.window.BESTracking.route('/program');t.window.BESTracking.route('/program');
 t.location.pathname='/';t.window.BESTracking.route('/');
 assert.equal(t.events().filter(x=>x.name==='page_view').length,3);
 assert.equal(t.events().filter(x=>x.name==='view_program').length,1);
});
test('page URLs retain campaign but drop tokens and personal query parameters',()=>{
 const t=setup({analytics:true},'https://beautyexpertsummit.com/?t=secret&email=alice@example.com&utm_source=meta#private');
 assert.equal(t.events()[0].params.page_location,'https://beautyexpertsummit.com/?utm_source=meta');
 assert.equal(t.events()[0].params.page_referrer,'https://example.com/');
});
test('specialty landing is measured explicitly',()=>{
 const t=setup({analytics:true},'https://beautyexpertsummit.com/co2-laser-blepharoplasty-training');
 assert.equal(t.events().filter(x=>x.name==='view_specialty_landing').length,1);
});
test('ticket handoff has exact item and currency, preserved UTM, and never purchase',()=>{
 const t=setup({analytics:true});
 const a={href:'https://buy.stripe.com/00w28sbSM6oo3MkdzugEg0T',matches:()=>true,closest:()=>null};
 t.listeners.click({target:{closest:()=>a}});
 const click=t.events().find(x=>x.name==='click_ticket'); const checkout=t.events().find(x=>x.name==='begin_checkout');
 assert.equal(click.params.item_name,'2-Day Delegate');assert.equal(click.params.price,340);assert.equal(click.params.currency,'EUR');
 assert.equal(checkout.params.items[0].item_id,'delegate_2day');assert.equal(new URL(a.href).searchParams.get('utm_source'),'meta');
 assert.equal(new URL(a.href).searchParams.get('client_reference_id'),'bes_123456_987654');
 assert.equal(t.events().some(x=>x.name==='purchase'),false);
});
test('unknown ticket URL is never assigned a fabricated price',()=>{
 const t=setup({analytics:true});const a={href:'https://buy.stripe.com/unknown',matches:()=>true};t.listeners.click({target:{closest:()=>a}});
 assert.equal(t.events().some(x=>x.name==='begin_checkout'),false);
});
test('lead hook is allowlisted and includes no submitted fields',()=>{
 const t=setup({analytics:true});t.window.BESTracking.lead('unknown','contact');t.window.BESTracking.lead('contact-form','contact');
 assert.equal(t.events().filter(x=>x.name==='generate_lead').length,1);
 assert.equal(JSON.stringify(t.events()).includes('alice@example'),false);
});
test('language event only records an actual change',()=>{
 const t=setup({analytics:true});t.window.BESTracking.language('en','en');t.window.BESTracking.language('en','es');
 assert.equal(t.events().filter(x=>x.name==='change_language').length,1);
});
test('private registration pages contain no tracking and no GTM',()=>{
 for (const file of ['registration-details/index.html','bes-registration/public/registration-details/index.html']) assert.doesNotMatch(fs.readFileSync(file,'utf8'),/gtag\(|fbq\(|googletagmanager|bes-tracking/);
});
test('forms call lead hook only in successful server-response branch',()=>{
 const s=fs.readFileSync('index.html','utf8');
 for(const id of ['contact-form','consult-form','mission-form']) assert.ok(s.includes("if (res.ok) {\n      if (window.BESTracking) window.BESTracking.lead('"+id+"'"));
 assert.equal((s.match(/data-bes-view="view_pricing"/g)||[]).length,1);
});
test('GTM router initializes once, has no automatic page view, and respects Meta consent',()=>{
 const html=fs.readFileSync('tracking/gtm-event-router.html','utf8').replace(/<\/?script>/g,'').replace('{{DLV - BES payload}}','payload');
 const scripts=[],w={};const context=vm.createContext({window:w,location:{hostname:'beautyexpertsummit.com'},document:{createElement:()=>({}),head:{appendChild:x=>scripts.push(x)}},payload:{name:'page_view',params:{page_location:'https://beautyexpertsummit.com/'},advertising:false}});
 vm.runInContext(html,context);context.payload={name:'click_program',params:{},advertising:false};vm.runInContext(html,context);
 assert.equal(scripts.length,1);assert.equal(w.fbq,undefined);
 const calls=w.dataLayer.map(x=>Array.from(x));assert.equal(calls.filter(x=>x[0]==='config').length,1);assert.equal(calls.find(x=>x[0]==='config')[2].send_page_view,false);
 context.payload={name:'begin_checkout',params:{currency:'EUR',value:340,items:[{item_id:'delegate_2day'}]},advertising:true};vm.runInContext(html,context);
 assert.equal(scripts.length,2);assert.equal(w.fbq.queue.filter(x=>x[1]==='InitiateCheckout').length,1);
});
test('GTM router does not send development traffic into production',()=>{
 const html=fs.readFileSync('tracking/gtm-event-router.html','utf8').replace(/<\/?script>/g,'').replace('{{DLV - BES payload}}','payload');
 const w={};vm.runInNewContext(html,{window:w,location:{hostname:'localhost'},payload:{name:'page_view'}});assert.equal(w.dataLayer,undefined);
});
